/*
Universal 3D Avatar Component
Works with any Ready Player Me or custom GLB avatar
*/

import React, { useEffect, useRef } from 'react';
import { useAnimations, useFBX, useGLTF } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';

const Developer = ({ animationName = 'idle', ...props }) => {
  const group = useRef();

  // Load your avatar
  const { scene } = useGLTF('/models/animations/my-avatar.glb');
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);

  // Load animations
  const { animations: idleAnimation } = useFBX('/models/animations/idle.fbx');
  const { animations: saluteAnimation } = useFBX('/models/animations/salute.fbx');
  const { animations: clappingAnimation } = useFBX('/models/animations/clapping.fbx');
  const { animations: victoryAnimation } = useFBX('/models/animations/victory.fbx');

  idleAnimation[0].name = 'idle';
  saluteAnimation[0].name = 'salute';
  clappingAnimation[0].name = 'clapping';
  victoryAnimation[0].name = 'victory';

  const { actions } = useAnimations(
    [idleAnimation[0], saluteAnimation[0], clappingAnimation[0], victoryAnimation[0]],
    group,
  );

  useEffect(() => {
    if (actions[animationName]) {
      actions[animationName].reset().fadeIn(0.5).play();
      return () => actions[animationName].fadeOut(0.5);
    }
  }, [animationName, actions]);

  // Simply render the entire cloned scene (works with any avatar!)
  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={clone} />
    </group>
  );
};

useGLTF.preload('/models/animations/my-avatar.glb');

export default Developer;
