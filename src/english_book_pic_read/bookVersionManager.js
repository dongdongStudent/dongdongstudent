// ==================== bookVersionManager.js ====================
// 教材版本管理模块 - 完整版（已移除本地存储，默认显示版本选择器）

import { F_get_template } from '../Function/weisimin.js';

class BookVersionManager {
    constructor() {
        this.versions = [];
        this.currentVersion = null;
        this.currentData = null;
        this.isLoaded = false;
        this.onVersionChangeCallbacks = [];
    }

    // 解析 F_get_template 返回的数据
    _parseResponse(response) {
        if (response && response.flag === 1 && response.content) {
            return response.content;
        }
        if (response && (response.versions || response.books)) {
            return response;
        }
        return response;
    }

    // 初始化：加载版本配置（不自动加载默认版本）
    async init(configFile = 'book_versions.json', autoLoadDefault = false) {
        try {
            const response = await F_get_template(configFile);
            const configRes = this._parseResponse(response);
            
            if (!configRes || !configRes.versions) {
                console.error('版本配置文件格式错误，缺少 versions 字段:', configRes);
                return null;
            }
            
            this.versions = (configRes.versions || []).filter(v => v.enabled !== false);
            this.versions.sort((a, b) => (a.order || 0) - (b.order || 0));
            
            if (autoLoadDefault === true) {
                const defaultCode = configRes.defaultVersion || this.versions[0]?.code;
                if (defaultCode) {
                    await this.loadVersion(defaultCode);
                }
            } else {
                this.currentVersion = null;
                this.currentData = null;
            }
            
            this.isLoaded = true;
            return this;
        } catch (error) {
            console.error('初始化版本配置失败:', error);
            return null;
        }
    }

    // 加载指定版本的书籍数据
    async loadVersion(versionCode) {
        const version = this.versions.find(v => v.code === versionCode);
        if (!version) {
            console.error(`版本 ${versionCode} 不存在或未启用`);
            return null;
        }

        try {
            const response = await F_get_template(version.file);
            const res = this._parseResponse(response);
            // console.log('11111',res)
            if (!res || !res.books) {
                console.error(`版本 ${versionCode} 数据格式错误，缺少 books 字段:`, res);
                return null;
            }
            // console.log('3123123', res,version)
            this.currentVersion = version;
            this.currentData = res;
            
            this._triggerVersionChange();
            
            return res;
        } catch (error) {
            console.error(`加载版本 ${versionCode} 失败:`, error);
            return null;
        }
    }

    // 获取所有可用版本列表
    getVersionList() {
        return this.versions.map(v => ({
            code: v.code,
            name: v.name,
            isCurrent: this.currentVersion?.code === v.code
        }));
    }

    // 获取当前版本信息
    getCurrentVersion() {
        return this.currentVersion;
    }

    // 获取当前版本code
    getCurrentVersionCode() {
        return this.currentVersion?.code || '';
    }

    // 获取当前版本名称
    getCurrentVersionName() {
        return this.currentVersion?.name || '';
    }

    // 获取当前书籍数据
    getCurrentBooks() {
        return this.currentData?.books || [];
    }

    // 获取原始完整数据
    getCurrentRawData() {
        return this.currentData;
    }

    // 根据年级和册获取书籍
    getBookByGradeAndVolume(grade, volume) {
        const books = this.getCurrentBooks();
        return books.find(book => book.grade === grade && book.volume === volume);
    }

    // 获取指定年级的所有书籍
    getBooksByGrade(grade) {
        const books = this.getCurrentBooks();
        return books.filter(book => book.grade === grade);
    }

    // 获取所有年级列表
    getGradeList() {
        const books = this.getCurrentBooks();
        const grades = {};
        books.forEach(book => {
            if (!grades[book.grade]) {
                grades[book.grade] = {
                    grade: book.grade,
                    grade_name: book.grade_name,
                    volumes: []
                };
            }
            grades[book.grade].volumes.push({
                volume: book.volume,
                volume_name: book.volume_name,
                id: book.id,
                units: book.units
            });
        });
        return Object.values(grades).sort((a, b) => a.grade - b.grade);
    }

    // 获取单元列表
    getUnits(bookId) {
        const books = this.getCurrentBooks();
        const book = books.find(b => b.id === bookId);
        return book?.units || [];
    }

    // 切换版本
    async switchVersion(versionCode) {
        if (this.currentVersion?.code === versionCode) {
            return this.currentData;
        }
        
        const data = await this.loadVersion(versionCode);
        return data;
    }

    // 注册版本切换回调
    onVersionChange(callback) {
        if (typeof callback === 'function') {
            this.onVersionChangeCallbacks.push(callback);
        }
    }

    // 移除版本切换回调
    offVersionChange(callback) {
        const index = this.onVersionChangeCallbacks.indexOf(callback);
        if (index > -1) {
            this.onVersionChangeCallbacks.splice(index, 1);
        }
    }

    // 触发版本切换回调
    _triggerVersionChange() {
        this.onVersionChangeCallbacks.forEach(callback => {
            try {
                callback(this.currentVersion, this.currentData);
            } catch (e) {
                console.error('版本切换回调执行失败:', e);
            }
        });
    }

    // 检查是否已初始化
    checkReady() {
        if (!this.isLoaded) {
            console.warn('版本管理器尚未初始化，请先调用 init() 方法');
            return false;
        }
        return true;
    }
}

// ==================== 工具函数 ====================

// 从URL参数获取版本
export function getVersionFromURL() {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('version');
}

// 初始化版本管理器（不自动加载默认版本，不使用本地存储）
export async function initBookManager() {
    const targetVersion = getVersionFromURL();
    
    if (targetVersion) {
        await bookManager.init('book_versions.json', false);
        if (bookManager.versions.find(v => v.code === targetVersion)) {
            await bookManager.switchVersion(targetVersion);
        }
    } else {
        await bookManager.init('book_versions.json', false);
    }
    
    return bookManager;
}

// 创建全局单例
export const bookManager = new BookVersionManager();

// 导出类
export default BookVersionManager;