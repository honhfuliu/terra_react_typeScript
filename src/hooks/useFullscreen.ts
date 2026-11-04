import { useEffect, useState } from 'react';

const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 切换全屏
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('切换全屏失败：', error);
    }
  };

  return {
    isFullscreen,
    toggleFullscreen,
  };
};

export default useFullscreen;
