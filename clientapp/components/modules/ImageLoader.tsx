import React, { useState, useEffect, useRef } from 'react';
import './ImageLoader.css'; // 需要创建对应的CSS文件

const ImageLoader = ({
  src, // 高清图URL
  placeholderSrc, // 低分辨率图URL（可以是同一张图的缩略版本）
  alt = '',
  width = '100%',
  height = 'auto',
  className = '',
  style = {},
} : {
    src: string;
    placeholderSrc: string;
    alt: string;
    width: string;
    height: string;
    className: string;
    style: React.CSSProperties;
}) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);
  const placeholderRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;

    img.onload = () => {
      setLoaded(true);
    };

    // 清理函数
    return () => {
      img.onload = null;
    };
  }, [src]);

  return (
    <div 
      className={`image-container ${className}`}
      style={{ 
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        ...style 
      }}
    >
      {/* 低分辨率模糊背景 */}
      <img
        ref={placeholderRef}
        src={placeholderSrc}
        alt={alt}
        className="placeholder-image"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'blur(10px)',
          transform: 'scale(1.1)', // 防止模糊边缘出现白边
          transition: 'opacity 0.5s ease',
          opacity: loaded ? 0 : 1,
        }}
      />
      
      {/* 高清图 */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="full-image"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      />
    </div>
  );
};

export default ImageLoader;