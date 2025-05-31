import { forwardRef, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { MenuDrop } from './MenuDrop';

const distance = 15;

interface SceneProps {
	items: string[];
}

function ResponsiveCamera() {
	const { camera, gl } = useThree();

	useEffect(() => {
		const handleResize = () => {
			const W = window.innerWidth;
			const H = window.innerHeight;
			const aspect = W / H;

			// Only update if orthographic
			if (
				'left' in camera &&
				'right' in camera &&
				'top' in camera &&
				'bottom' in camera
			) {
				camera.left = -distance * aspect;
				camera.right = distance * aspect;
				camera.top = distance;
				camera.bottom = -distance;
				camera.updateProjectionMatrix();
			}
			gl.setSize(W, H);
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [camera, gl]);

	return null;
}

export const Scene = forwardRef<{ reset: () => void }, SceneProps>(
	({ items }, ref) => {
		const [aspect, setAspect] = useState(
			window.innerWidth / window.innerHeight
		);

		useEffect(() => {
			const handleResize = () => {
				setAspect(window.innerWidth / window.innerHeight);
			};

			window.addEventListener('resize', handleResize);
			return () => window.removeEventListener('resize', handleResize);
		}, []);

		return (
			<Canvas
				orthographic
				camera={{
					position: [-10, 10, 10],
					zoom: 1,
					left: -distance * aspect,
					right: distance * aspect,
					top: distance,
					bottom: -distance,
					near: -5,
					far: 100,
				}}
				gl={{ antialias: true, alpha: true }}
			>
				<ResponsiveCamera />
				<color attach='background' args={['#202533']} />
				<fog attach='fog' args={['#202533', -10, 100]} />

				<ambientLight intensity={0.5} />
				<directionalLight position={[5, 5, 20]} intensity={0.5} />
				<directionalLight position={[-5, -5, -10]} intensity={1} />

				<Physics gravity={[0, -50, 0]}>
					<MenuDrop ref={ref} items={items} />
				</Physics>
			</Canvas>
		);
	}
);
