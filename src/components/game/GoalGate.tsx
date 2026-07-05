export function GoalGate({ z }: { z: number }) {
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[7.2, 0.32, 0.8]} />
        <meshStandardMaterial color="#ffd84d" emissive="#8c6500" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[-3.3, 1.8, 0]}>
        <boxGeometry args={[0.34, 3.6, 0.34]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[3.3, 1.8, 0]}>
        <boxGeometry args={[0.34, 3.6, 0.34]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 3.45, 0]}>
        <boxGeometry args={[6.9, 0.42, 0.34]} />
        <meshStandardMaterial color="#ff6b7f" emissive="#7d1427" emissiveIntensity={0.12} />
      </mesh>
    </group>
  )
}
