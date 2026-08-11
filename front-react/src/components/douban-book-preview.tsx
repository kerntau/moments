import React from 'react';
import type { DoubanBook } from '@/types';

interface DoubanBookPreviewProps {
  book?: DoubanBook;
}

export const DoubanBookPreview: React.FC<DoubanBookPreviewProps> = ({ book }) => {
  if (!book) return null;

  return (
    <div className="douban-card-block flex justify-center items-center w-full max-h-[400px]">
      <a
        className="douban-card flex m-2.5 p-4 rounded-[15px] relative justify-center items-center overflow-hidden text-[#faebd7] no-underline hover:no-underline"
        href={book.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <div
          className="douban-card-bgimg absolute w-[115%] h-[115%] blur-[15px] brightness-60 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${book.image}')` }}
        />
        <div className="flex gap-2 relative z-10">
          <div className="douban-card-left relative flex flex-col items-center group">
            <div
              className="douban-card-img relative h-[130px] w-[80px] bg-cover bg-center bg-no-repeat transition-all duration-500 group-hover:blur-[5px] group-hover:brightness-60 group-hover:[transform:perspective(800px)_rotateX(180deg)]"
              style={{ backgroundImage: `url('${book.image}')` }}
            />
          </div>
          <div className="douban-card-right w-fit max-w-[120px] overflow-hidden relative flex flex-col ml-3 text-sm leading-relaxed text-[#faebd7]">
            <div className="mt-1 truncate">
              <span>书名: </span>
              <strong>{book.title}</strong>
            </div>
            <div className="mt-1 truncate">
              <span>作者: </span>
              <span>{book.author}</span>
            </div>
            <div className="mt-1 truncate">
              <span>出版年份: </span>
              <span>{book.pubDate}</span>
            </div>
            <div className="mt-1 truncate">
              <span>评分: </span>
              <span>{book.rating}</span>
            </div>
          </div>
          <div className="flex-1 z-10 indent-2 text-sm hidden sm:block line-clamp-6 text-[#faebd7]">
            {book.desc}
          </div>
        </div>
      </a>
    </div>
  );
};
