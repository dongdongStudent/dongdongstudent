import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import Hls from 'hls.js';
// import './VideoPlayer.scss'; // 如果有样式文件

const VideoPlayer = forwardRef(({ src, isVisible }, ref) => {
    const videoRef = useRef(null);
    const containerRef = useRef(null); // 添加容器引用
    const hlsRef = useRef(null);
    const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!isVisible) {
            // 如果 isVisible 为 false，停止播放并销毁资源
            if (videoRef.current) {
                videoRef.current.pause();
            }
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
            return;
        }

        // 如果 isVisible 为 true，初始化播放器
        if (Hls.isSupported() && src) {
            const hls = new Hls({
                enableWorker: false,
                lowLatencyMode: true,
            });
            hlsRef.current = hls;

            hls.loadSource(src);
            hls.attachMedia(videoRef.current);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('HLS 视频加载完成');
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS 错误:', data);
            });
        } else if (videoRef.current && videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
            videoRef.current.src = src;
        }

        // 清理函数
        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, [src, isVisible]);

    // 监听视频尺寸变化
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateVideoSize = () => {
            setVideoSize({
                width: video.videoWidth,
                height: video.videoHeight
            });
        };

        video.addEventListener('loadedmetadata', updateVideoSize);
        video.addEventListener('resize', updateVideoSize);

        return () => {
            video.removeEventListener('loadedmetadata', updateVideoSize);
            video.removeEventListener('resize', updateVideoSize);
        };
    }, []);

    // 监听容器尺寸变化
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(() => {
            // 容器尺寸变化时，可以调整布局
            if (videoRef.current && container) {
                adjustVideoSize();
            }
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // 调整视频尺寸以适应容器
    const adjustVideoSize = () => {
        if (!videoRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const video = videoRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const videoWidth = video.videoWidth || containerWidth;
        const videoHeight = video.videoHeight || containerHeight;

        // 计算适合容器的尺寸
        const containerRatio = containerWidth / containerHeight;
        const videoRatio = videoWidth / videoHeight;

        let width, height;

        if (videoRatio > containerRatio) {
            // 视频更宽，高度适应容器
            width = containerWidth;
            height = containerWidth / videoRatio;
        } else {
            // 视频更高，宽度适应容器
            height = containerHeight;
            width = containerHeight * videoRatio;
        }

        // 设置视频样式
        video.style.width = `${width}px`;
        video.style.height = `${height}px`;
        video.style.maxWidth = '100%';
        video.style.maxHeight = '100%';
        video.style.objectFit = 'contain'; // 保持比例填充
    };

    // 当视频元数据加载完成时调整尺寸
    const handleLoadedMetadata = () => {
        adjustVideoSize();
    };

    // 暴露更多方法给父组件
    useImperativeHandle(ref, () => ({
        // 播放控制
        play: () => {
            if (videoRef.current) {
                videoRef.current.play().catch(error => {
                    console.error('播放失败:', error);
                });
            }
        },
        pause: () => {
            if (videoRef.current) {
                videoRef.current.pause();
            }
        },
        // 销毁资源
        destroy: () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.src = '';
            }
        },
        // 获取原生视频元素
        getVideoElement: () => videoRef.current,
        // 获取当前时间
        getCurrentTime: () => videoRef.current ? videoRef.current.currentTime : 0,
        // 设置当前时间
        setCurrentTime: (time) => {
            if (videoRef.current) {
                videoRef.current.currentTime = time;
            }
        },
        // 调整尺寸以适应容器
        fitToContainer: () => {
            adjustVideoSize();
        },
        // 切换全屏
        toggleFullscreen: () => {
            if (!containerRef.current) return;
            
            if (!document.fullscreenElement) {
                if (containerRef.current.requestFullscreen) {
                    containerRef.current.requestFullscreen();
                } else if (containerRef.current.webkitRequestFullscreen) {
                    containerRef.current.webkitRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            }
        }
    }));

    return (
        <div 
            ref={containerRef}
            style={styles.container}
        >
            <video
                ref={videoRef}
                controls
                preload="metadata"
                onLoadedMetadata={handleLoadedMetadata}
                style={styles.video}
            />
        </div>
    );
});

// 内联样式
const styles = {
    container: {
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    video: {
        width: 'auto',
        height: 'auto',
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
        display: 'block',
        backgroundColor: 'transparent'
    },
    aspectRatioIndicator: {
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        color: 'white',
        padding: '4px 8px',
        fontSize: '12px',
        borderRadius: '4px',
        zIndex: 10
    },
    sizeText: {
        fontWeight: 'bold'
    }
};

export default VideoPlayer;