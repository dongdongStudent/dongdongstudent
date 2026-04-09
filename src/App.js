// App.js
import { Route, Routes, HashRouter as Router } from "react-router-dom";
// 0_admin

import Main from "./Main.js";
import R_movie_pepa from "./movie/movie_pepa.js";
import R_book from "./book/Reading.js";
import R_listen from "./listen/listen_1.js";
import R_listen_2 from "./listen/Listen_2.js";
import R_listen_3 from "./listen/Listen_3.js";
import R_listen_speeed from "./listen/listen_speed_5.js";
import Sentence_listen from "./listen/sentence_listen_spell.js";
import Book_senntence_test from "./teacher/book_senntence_test.js";
import English_test_select from "./english_1_select_test/select_center.js";
import English_test_cloze from "./english_2_Cloze_test/cloze_center.js"
import English_WordbankParent from "./english_3_Cloze_Test_WordBank/WordbankParent.js"
import English_test_CtoE from "./english_4_C_to_E_Sentence_Completion/english_test_CtoE_center.js";
import English_test_cloze_sentence from "./english_5_cloze_sentence/ClozeCenter.js";
import English_test_cloze_bank_select from "./english_6_cloze_wordbank_select/center.js";
import English_test_cloze_passage from "./english_7_passage_cloze/center.js";
import English_test_8_reading_comprehension from "./english_8_reading_comprehension/center.js"
import English_book_1_work from "./english_book_1_work/center.js"
import English_a_z from "./english_a_z/center.js"
import Sentence_view from "./sentence/review_center.js"
import Test from "./test/test.js";
import Test_1 from "./test/test_1.js";
import Test_2 from "./test/test_2.js";
import Math_test_select_enhanced from "./math_1_select/center_enhanced.js";
import English_book_pic_read from "./english_book_pic_read/center.js";

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={< Main />} />
                <Route path="/movie_pepa" element={< R_movie_pepa />} />
                <Route path="/book" element={< R_book />} />
                <Route path="/listen" element={< R_listen />} />
                <Route path="/listen_2" element={< R_listen_2 />} />
                <Route path="/listen_3" element={< R_listen_3 />} />
                <Route path="/listen_speed" element={< R_listen_speeed />} />
                <Route path="/sentence_listen" element={< Sentence_listen/>} />
                <Route path="/test" element={< Test/>} />
                <Route path="/test_1" element={< Test_1/>} />
                <Route path="/test_2" element={< Test_2/>} />
                <Route path="/book_senntence_test" element={< Book_senntence_test/>} />
                <Route path="/english_test_select" element={< English_test_select/>} />
                <Route path="/english_test_cloze" element={< English_test_cloze/>} />
                <Route path="/english_test_wordbank" element={< English_WordbankParent/>} />
                <Route path="/english_test_CtoE" element={< English_test_CtoE/>} />
                <Route path="/english_test_cloze_sentence" element={< English_test_cloze_sentence/>} />
                <Route path="/english_test_cloze_bank_select" element={< English_test_cloze_bank_select/>} />
                <Route path="/english_test_cloze_passage" element={< English_test_cloze_passage/>} />
                <Route path="/english_test_8_reading_comprehension" element={< English_test_8_reading_comprehension/>} />
                <Route path="/english_book_1_work" element={< English_book_1_work/>} />
                <Route path="/english_a_z" element={< English_a_z/>} />
                <Route path="/sentence_view" element={< Sentence_view/>} />
                <Route path="/math_test_select" element={< Math_test_select_enhanced/>} />
                <Route path="/english_book_pic_read/*" element={< English_book_pic_read />} />
            </Routes>
        </Router>
    );
};

export default App;
