import {
	useRef,
	useEffect,
	useImperativeHandle,
	forwardRef,
	createContext,
	useContext,
} from 'react';
import {
	useBox,
	useConeTwistConstraint,
	usePlane,
	type PublicApi,
} from '@react-three/cannon';
import { useLoader } from '@react-three/fiber';
import { FontLoader, TextGeometry, Font } from 'three-stdlib';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { useState } from 'react';

const colors = [
	{ from: new THREE.Color('#ff699f'), to: new THREE.Color('#a769ff') },
	{ from: new THREE.Color('#683fee'), to: new THREE.Color('#527ee1') },
	{ from: new THREE.Color('#ee663f'), to: new THREE.Color('#f5678d') },
	{ from: new THREE.Color('#ee9ca7'), to: new THREE.Color('#ffdde1') },
	{ from: new THREE.Color('#f7971e'), to: new THREE.Color('#ffd200') },
	{ from: new THREE.Color('#56ccf2'), to: new THREE.Color('#2f80ed') },
	{ from: new THREE.Color('#fc5c7d'), to: new THREE.Color('#6a82fb') },
	{ from: new THREE.Color('#dce35b'), to: new THREE.Color('#45b649') },
];

const GroundContext = createContext<{ current: PublicApi[] }>({ current: [] });

function Ground({ position }: { position: [number, number, number] }) {
	const groundBodies = useContext(GroundContext);
	const [ref, api] = usePlane(() => ({
		position,
		rotation: [-Math.PI / 2, 0, 0],
	}));
	useEffect(() => {
		groundBodies.current[0] = api;
		api.sleep();
	}, []);
	return <mesh ref={ref} receiveShadow />;
}

function Letter({
	letter,
	color,
	font,
	position,
	size,
	onImpulse,
	refCallback,
	wordLength,
	url,
}: {
	letter: string;
	color: THREE.Color;
	font: Font;
	position: [number, number, number];
	size: [number, number, number];
	onImpulse: (api: PublicApi) => void;
	refCallback: (api: PublicApi) => void;
	wordLength: number;
	url: string;
}) {
	const geometryRef = useRef<TextGeometry>();
	const [refBox, api] = useBox(() => ({
		mass: 1 / wordLength,
		position,
		args: size,
		angularDamping: 0.99,
		material: { friction: 0.002, restitution: 0.2 },
	}));

	if (!geometryRef.current) {
		const geometry = new TextGeometry(letter, {
			font,
			size: 3,
			height: 0.4,
			bevelEnabled: true,
			bevelThickness: 0.9,
			bevelSize: 0.3,
		});
		geometry.computeBoundingBox();
		geometry.translate(-(geometry.boundingBox?.max.x ?? 0) / 2, 0, 0);
		geometryRef.current = geometry;
	}

	useEffect(() => {
		refCallback(api);
		// Unsubscribe from Cannon.js position subscription on unmount
		const unsub = api.position.subscribe(() => {});
		return () => unsub();
	}, [api, refCallback]);

	const handleClick = () => {
		onImpulse(api);
		if (url) window.location.href = url;
	};

	return (
		<mesh ref={refBox} castShadow receiveShadow onClick={handleClick}>
			<primitive object={geometryRef.current} />
			<meshPhongMaterial color={color} shininess={100} />
		</mesh>
	);
}

function Constraint({
	a,
	b,
	sizeA,
	letterAPIs,
}: {
	a: number;
	b: number;
	sizeA: number;
	letterAPIs: React.MutableRefObject<PublicApi[]>;
}) {
	useConeTwistConstraint(letterAPIs.current[a], letterAPIs.current[b], {
		pivotA: [sizeA, 0, 0],
		pivotB: [0, 0, 0],
		axisA: [1, 0, 0],
		axisB: [1, 0, 0],
		angle: 0,
		twistAngle: 0,
		maxForce: 1e30,
		collideConnected: true,
	});
	return null;
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
	const arr = array.slice();
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

export const MenuDrop = forwardRef(function MenuDrop(
	{
		items = [],
		position = [0, 0, 0],
	}: {
		items?: { label: string; href: string }[];
		position?: [number, number, number];
	},
	ref
) {
	const [sceneKey, setSceneKey] = useState(0);
	const [shuffledColors, setShuffledColors] = useState(() =>
		shuffleArray(colors)
	);
	const [responsive, setResponsive] = useState({ margin: 6, fontSize: 3 });
	const font = useLoader(FontLoader, '/fonts/helvetiker_bold.typeface.json');
	const letterAPIs = useRef<PublicApi[]>([]);
	let idx = 0;
	const letters: JSX.Element[] = [];
	const constraints: JSX.Element[] = [];

	// Responsive margin and font size
	useEffect(() => {
		function updateResponsive() {
			const isMobile = window.innerWidth < 600;
			setResponsive({ margin: isMobile ? 4 : 6, fontSize: isMobile ? 2 : 3 });
		}
		updateResponsive();
		window.addEventListener('resize', updateResponsive);
		return () => window.removeEventListener('resize', updateResponsive);
	}, []);

	useEffect(() => {
		setShuffledColors(shuffleArray(colors));
		letterAPIs.current = [];
	}, [sceneKey]);

	items.forEach((item, i) => {
		const word = item.label;
		const href = item.href;
		const color = shuffledColors[i % shuffledColors.length];
		const sizes: number[] = [];
		let len = 0;
		let xOffset = 0;
		for (let j = 0; j < word.length; j++) {
			const geom = new TextGeometry(word[j], {
				font,
				size: responsive.fontSize,
				height: 0.4,
			});
			geom.computeBoundingBox();
			const sizeX = geom.boundingBox?.getSize(new THREE.Vector3()).x || 1;
			sizes.push(sizeX * 0.5);
			xOffset += sizeX * 2;
		}
		// Centering logic
		const totalHeight = (items.length - 1) * responsive.margin;
		const startY = -totalHeight / 2;
		for (let j = 0; j < word.length; j++) {
			const progress = j / (word.length - 1 || 1);
			const col = color.from.clone().lerp(color.to, progress);
			const zStack = i * responsive.margin;
			const pos = [
				position[0] + len - xOffset / 2,
				position[1] + startY + i * responsive.margin + 30 + j * 0.01,
				position[2] + zStack,
			] as [number, number, number];
			letters.push(
				<Letter
					key={`letter-${idx}`}
					letter={word[j]}
					color={col}
					position={pos}
					size={[sizes[j], 1.5, 1]}
					font={font}
					wordLength={word.length}
					url={href}
					onImpulse={(api) => {
						// Strong, random impulse and torque
						const x = (Math.random() - 0.5) * 60;
						const y = Math.random() * 40 + 20;
						const z = (Math.random() - 0.5) * 60;
						api.applyImpulse([x, y, z], [0, 0, 0]);
						api.applyTorque([
							(Math.random() - 0.5) * 20,
							(Math.random() - 0.5) * 20,
							(Math.random() - 0.5) * 20,
						]);
					}}
					refCallback={(api) => {
						letterAPIs.current[idx] = api;
					}}
				/>
			);
			if (j > 0) {
				constraints.push(
					<Constraint
						key={`const-${idx}`}
						a={idx - 1}
						b={idx}
						sizeA={sizes[j - 1]}
						letterAPIs={letterAPIs}
					/>
				);
			}
			len += sizes[j] * 2;
			idx++;
		}
	});

	useImperativeHandle(ref, () => ({
		reset: () => setSceneKey((k) => k + 1),
	}));

	return (
		<GroundContext.Provider value={{ current: [] }} key={sceneKey}>
			<OrbitControls enablePan={false} />
			<ambientLight intensity={0.5} />
			<directionalLight position={[10, 20, 10]} intensity={1.25} castShadow />
			<group>
				<Ground position={[0, -2, 0]} />
				{letters}
				{constraints}
			</group>
		</GroundContext.Provider>
	);
});
