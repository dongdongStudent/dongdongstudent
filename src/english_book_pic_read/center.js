import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import R_select_content from './R_select_content.js';
import R_item_learn_book from './R_item_learn_book.js';

// 主中心组件
const EnglishBookPicReadCenter = () => {
  return (
    <Routes>
      <Route path="/" element={<R_select_content />} />
      <Route path="/book-learn" element={<R_item_learn_book />} />
      <Route path="/book-select/:version/:grade/:volume" element={<R_select_content />} />
    </Routes>
  );
};

export default EnglishBookPicReadCenter;