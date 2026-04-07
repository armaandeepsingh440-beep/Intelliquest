import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Background3D = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.002);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 300;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Clear previous children (react strict mode double-mount fix)
    while(containerRef.current.firstChild){
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);

    // Particles (Neural Network Nodes)
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 400; // number of nodes
    
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
        // Spread particles across a wide 3D space
      posArray[i] = (Math.random() - 0.5) * 800;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    // Create glowing material
    const particleMaterial = new THREE.PointsMaterial({
      size: 4,
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const particlesMesh = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particlesMesh);

    // Lines (Neural Network Connections)
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xbc13fe,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending
    });

    const linesMesh = new THREE.LineSegments(
      new THREE.BufferGeometry(), // Will be updated on frame
      lineMaterial
    );
    scene.add(linesMesh);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
      mouseY = -(event.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.002;

      // Rotate particles slowly
      particlesMesh.rotation.y = time * 0.5;
      particlesMesh.rotation.x = time * 0.2;
      linesMesh.rotation.y = time * 0.5;
      linesMesh.rotation.x = time * 0.2;

      // Interactive camera movement based on mouse
      camera.position.x += (mouseX * 50 - camera.position.x) * 0.05;
      camera.position.y += (mouseY * 50 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      // Update lines based on proximity (very basic pseudo-computation to simulate neural net)
      const positions = particlesMesh.geometry.attributes.position.array;
      const linePositions = [];
      
      // We only compute connections for a subset to save performance
      for (let i = 0; i < particleCount; i++) {
          for (let j = i + 1; j < particleCount; j++) {
              const dx = positions[i*3] - positions[j*3];
              const dy = positions[i*3+1] - positions[j*3+1];
              const dz = positions[i*3+2] - positions[j*3+2];
              const distSq = dx*dx + dy*dy + dz*dz;
              
              if (distSq < 15000) {
                  linePositions.push(
                      positions[i*3], positions[i*3+1], positions[i*3+2],
                      positions[j*3], positions[j*3+1], positions[j*3+2]
                  );
              }
          }
      }
      
      linesMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if(containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        background: 'var(--bg-dark)'
      }}
    />
  );
};

export default Background3D;
