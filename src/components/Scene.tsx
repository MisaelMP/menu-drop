import { forwardRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { MenuDrop } from './MenuDrop';
import * as THREE from 'three';

const distance = 15;
const yOffset = -10;

interface SceneProps {
	items: { label: string; href: string }[];
}

// Camera controller component to handle resize and camera updates
function CameraController() {
	const { camera, size, scene } = useThree();

	useEffect(() => {
		const handleResize = () => {
			const aspect = size.width / size.height;
			if (camera instanceof THREE.OrthographicCamera) {
				camera.top = distance + yOffset;
				camera.right = distance * aspect;
				camera.bottom = -distance + yOffset;
				camera.left = -distance * aspect;
				camera.updateProjectionMatrix();
			}

			const isMobile = window.innerWidth < 768;
			const scale = isMobile ? 0.7 : 1;
			scene.scale.set(scale, scale, scale);
		};

		window.addEventListener('resize', handleResize);
		handleResize();
		return () => window.removeEventListener('resize', handleResize);
	}, [camera, size, scene]);

	return null;
}

export const Scene = forwardRef<{ reset: () => void }, SceneProps>(
	({ items }, ref) => {
		return (
			<Canvas
				orthographic
				camera={{
					position: [-10, 10, 10],
					zoom: 1,
					left: -distance,
					right: distance,
					top: distance + yOffset,
					bottom: -distance + yOffset,
					near: -1,
					far: 100,
				}}
				gl={{
					antialias: true,
					alpha: true,
					pixelRatio: window.devicePixelRatio,
				}}
			>
				<CameraController />

				<color attach='background' args={[0x202533]} />
				<fog attach='fog' args={[0x202533, -1, 100]} />

				<group position={[0, yOffset, 0]}>
					<ambientLight color={0xcccccc} />
					<directionalLight
						position={[5, 5, 20]}
						intensity={0.5}
						color={0xffffff}
					/>
					<directionalLight
						position={[-5, -5, -10]}
						intensity={1}
						color={0xffffff}
					/>

					<Physics
						gravity={[0, -35, 0]}
						defaultContactMaterial={{
							friction: 5,
							restitution: 0.15,
							contactEquationRelaxation: 3,
							contactEquationStiffness: 1e8,
						}}
						broadphase='SAP'
						iterations={10}
					>
						<MenuDrop ref={ref} items={items} position={[0, 0, 0]} />
					</Physics>
				</group>
			</Canvas>
		);
	}
);
