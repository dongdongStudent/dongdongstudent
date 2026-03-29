const express = require('express');
const app = express();
const path = require('path');
const book = require("./src/router/1_book.js");
const userRouter = require("./src/router/2_user.js");// 这是数据库的
const userRouter_j = require("./src/router/json_user_routes.js");// 这是json的
const G_personal = require("./src/router/personal.js");
const G_personal_j = require("./src/router/json_personal.js");
const resource = require("./src/router/resource.js");
const admin = require("./src/router/admin.js");
const bodyParser = require("body-parser");
const cors = require("cors");

const logger = (req, res, next) => {
  console.log('---------', `${req.method} ${req.url}`);
  next();
};

app.use(logger);
app.use(cors());
app.use(bodyParser.json({ limit: '500mb' })); // 限制上传文件大小
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true })); // 限制上传文件大小

app.use('/server/resource/', express.static(path.join(__dirname, '/resource/'))); // 静态资源目录
app.use('/server/resource/', resource);
app.use("/server/api", userRouter); // 默认数据库的
app.use("/server/personal", G_personal);
app.use("/server/api/json", userRouter_j);
app.use("/server/personal/json", G_personal_j);
app.use("/server/admin", admin); // 

app.use((req, res) => { // 自定义 404 处理
  res.status(404).send('输入的接口地址不存在,请检查后重试！');
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});

