// 环境检测
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const G_config = { // 全局配置
    // 根据环境自动选择服务器地址
    G_server_address: isDevelopment 
        ? 'http://localhost:3001/server'  // 开发环境
        : 'https://www.ddstudent.xyz/server', // 生产环境
    
    G_template: 'template_english_test.js',
    
    // 环境信息
    isDevelopment: isDevelopment,
    currentHost: window.location.hostname
}

// 1. 读取字幕文件
export const fetchSRT = async (path) => { // 5. 读取字幕文件
    const parseSRT = (data) => { // 解析字幕数据,赋值给subtitles_1
        const convertToSeconds = (time) => {
            const parts = time.split(':');
            const seconds = parseFloat(parts[2].replace(',', '.'));
            return (+parts[0]) * 3600 + (+parts[1]) * 60 + seconds;
        };
        const lines = data.split('\n');
        const subtitles = [];
        let index = 0;
        let num = 0;

        while (index < lines.length) {
            if (lines[index].trim() === '') {
                index++;
                continue;
            }

            if (!/^\d+$/.test(lines[index].trim())) {
                index++;
                continue;
            }

            const startEnd = lines[index + 1]?.split(' --> ');
            if (!startEnd || startEnd.length !== 2) {
                index += 4;
                continue;
            }

            const start = convertToSeconds(startEnd[0]) + G_sub_time;
            const end = convertToSeconds(startEnd[1]) + G_sub_time;
            const text = lines[index + 2] || '';
            const key = num;

            subtitles.push({ text, start, end, key });
            index += 4;
            num++;
        }

        return subtitles;
    };

    let G_sub_time = 0; // 字幕开始时间
    try {
        const response = await fetch(path);

        // 检查响应是否成功
        if (!response.ok) {
            throw new Error(`网络错误：${response.status}`);
        }

        const text = await response.text();

        const parsedSubtitles = parseSRT(text);
        return parsedSubtitles;
    } catch (error) {
        console.error('读取字幕失败', error); // 打印错误信息
    }
};

// 2. 绘制网格
export function F_draw_grid(scene, gridSize) { // 绘制网格  入口: scene, gridSize(网格大小)
    
    
    const rows = Math.ceil(scene.cameras.main.height / gridSize) + 10;
    const cols = Math.ceil(scene.cameras.main.width / gridSize) + 10;
    console.log('绘制网格', rows);
    const graphics = scene.add.graphics();
    graphics.lineStyle(1, 0xff0000, 1);

    for (let row = 0; row <= rows; row++) {
        graphics.moveTo(0, row * gridSize);
        graphics.lineTo(cols * gridSize, row * gridSize);
    }

    for (let col = 0; col <= cols; col++) {
        graphics.moveTo(col * gridSize, 0);
        graphics.lineTo(col * gridSize, rows * gridSize);
    }

    graphics.strokePath();

    const style = { font: '12px Arial', fill: '#000000' };
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = col * gridSize + gridSize / 2;
            const y = row * gridSize + gridSize / 2;
            scene.add.text(x - 10, y, `${col},${row}`, style);
        }
    }
}
// 3. 获取token
const TOKEN_KEY = 'geek_pc'//定义一个常量，用于存储令牌的键名

export const setToken = token => localStorage.setItem(TOKEN_KEY, token)//定义一个函数，用于存储令牌
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)
