import React from 'react';
import type { DoubanMovie } from '@/types';

interface DoubanMoviePreviewProps {
  movie?: DoubanMovie;
}

export const DoubanMoviePreview: React.FC<DoubanMoviePreviewProps> = ({ movie }) => {
  if (!movie) return null;

  return (
    <div className="douban-card-block flex items-center w-full max-h-[400px]">
      <a
        className="douban-card flex m-2.5 p-4 rounded-[15px] relative max-w-[400px] justify-center items-center overflow-hidden text-[#faebd7] no-underline hover:no-underline"
        href={movie.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <div
          className="douban-card-bgimg absolute w-[115%] h-[115%] blur-[15px] brightness-60 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${movie.image}')` }}
        />
        <div className="douban-card-left relative flex flex-col items-center group z-10">
          <div
            className="douban-card-img relative h-[130px] w-[80px] bg-cover bg-center bg-no-repeat transition-all duration-500 group-hover:blur-[5px] group-hover:brightness-60 group-hover:[transform:perspective(800px)_rotateX(180deg)]"
            style={{ backgroundImage: `url('${movie.image}')` }}
          />
        </div>
        <div className="douban-card-right relative flex flex-col ml-3 text-sm leading-relaxed text-[#faebd7] z-10">
          <div className="mt-1">
            <span>电影名: </span>
            <strong>{movie.title}</strong>
          </div>
          <div className="mt-1 line-clamp-1">
            <span>主演: </span>
            <span>{movie.actors}</span>
          </div>
          <div className="mt-1">
            <span>导演: </span>
            <span>{movie.director}</span>
          </div>
          <div className="mt-1">
            <span>上映时间: </span>
            <span>{movie.releaseDate}</span>
          </div>
          <div className="mt-1">
            <span>评分: </span>
            <span>{movie.rating}</span>
            <span className="ml-4">时长: </span>
            <span>{movie.runtime}分钟</span>
          </div>
        </div>
      </a>
    </div>
  );
};
