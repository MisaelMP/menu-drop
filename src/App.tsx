import { useRef } from 'react';
import { Scene } from './components/Scene'; // Corrected import statement

const menuItems = [
	{ label: 'Misael', href: '/misael' },
	{ label: 'About', href: '/about' },
	{ label: 'Projects', href: '/projects' },
	{ label: 'Contact', href: '/contact' },
];

function App() {
	const sceneRef = useRef<{ reset: () => void }>(null);

	return (
		<div className='w-full h-screen bg-[#202533]'>
			<Scene ref={sceneRef} items={menuItems} />
			<div className='fixed bottom-4 right-4 flex gap-2'>
				<button
					onClick={() => sceneRef.current?.reset()}
					className='px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors'
				>
					Reset
				</button>
			</div>
		</div>
	);
}

export default App;
