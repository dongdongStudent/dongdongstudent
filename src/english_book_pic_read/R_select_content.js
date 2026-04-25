import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import './scss/R_select_content.scss';
import { useNavigate, useLocation } from 'react-router-dom';
import { G_config } from '../config.js';
import WordTranslator from '../translator/index.js';
import { initBookManager, bookManager } from './bookVersionManager.js';

// 年级配置
const GRADES = [
    { id: 3, name: '三年级' },
    { id: 4, name: '四年级' },
    { id: 5, name: '五年级' },
    { id: 6, name: '六年级' },
    { id: 7, name: '七年级' },
];

// 学期配置
const VOLUMES = [
    { id: 'upper', name: '上册' },
    { id: 'lower', name: '下册' },
];

// 默认图片（使用 data:image 或在线图片，避免无限循环）
const DEFAULT_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280"%3E%3Crect width="200" height="280" fill="%23f0f0f0"/%3E%3Ctext x="100" y="140" font-size="14" text-anchor="middle" fill="%23999"%3E暂无封面%3C/text%3E%3C/svg%3E';

const R_select_content = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // 从 location.state 恢复选择状态（从学习页面返回时）
    const getInitialState = () => {
        const state = location.state;
        if (state && state.fromLearn) {
            return {
                versionCode: state.version || null,
                grade: GRADES.find(g => g.id === state.grade) || null,
                volume: VOLUMES.find(v => v.id === state.volume) || null,
                showUnits: true
            };
        }
        return {
            versionCode: null,
            grade: null,
            volume: null,
            showUnits: false
        };
    };

    const initialData = getInitialState();

    // 选择状态 - 初始都为 null，显示版本选择器
    const [versionList, setVersionList] = useState([]);
    const [selectedVersionCode, setSelectedVersionCode] = useState(null);
    const [selectedGrade, setSelectedGrade] = useState(null);
    const [selectedVolume, setSelectedVolume] = useState(null);
    const [catalogData, setCatalogData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [showUnits, setShowUnits] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    // 记录图片加载失败状态
    const [failedImages, setFailedImages] = useState({});
    // 记录学期封面图片加载失败状态
    const [volumeCoverFailed, setVolumeCoverFailed] = useState({});

    // 翻译器状态
    const [translatorOpen, setTranslatorOpen] = useState(false);
    const translatorRef = useRef(null);

    const itemsPerPage = 10;

    // 获取当前选中的版本对象
    const selectedVersion = useMemo(() => {
        return versionList.find(v => v.code === selectedVersionCode);
    }, [versionList, selectedVersionCode]);

    // 初始化版本管理器
    useEffect(() => {
        const initVersionManager = async () => {
            setLoading(true);
            try {
                const manager = await initBookManager();
                const versions = manager.getVersionList();
                setVersionList(versions);
                const currentCode = manager.getCurrentVersionCode();
                if (currentCode) {
                    setSelectedVersionCode(currentCode);
                }
                manager.onVersionChange((newVersion, data) => {
                    setSelectedGrade(null);
                    setSelectedVolume(null);
                    setCatalogData(null);
                    setShowUnits(false);
                    setCurrentPage(0);
                    // 版本切换时清空失败图片记录
                    setFailedImages({});
                    setVolumeCoverFailed({});
                });
                setIsInitialized(true);
            } catch (error) {
                console.error('初始化版本管理器失败:', error);
            } finally {
                setLoading(false);
            }
        };
        initVersionManager();
    }, []);

    // 从 URL 参数或 state 恢复选择
    useEffect(() => {
        if (!isInitialized) return;

        if (initialData.versionCode && initialData.grade && initialData.volume) {
            if (!selectedVersionCode) {
                setSelectedVersionCode(initialData.versionCode);
            }
            if (!selectedGrade) {
                setSelectedGrade(initialData.grade);
            }
            if (!selectedVolume) {
                setSelectedVolume(initialData.volume);
            }
            if (initialData.showUnits) {
                setShowUnits(true);
            }
            return;
        }

        const params = new URLSearchParams(location.search);
        const versionParam = params.get('version');
        const gradeParam = params.get('grade');
        const volumeParam = params.get('volume');

        if (versionParam && !selectedVersionCode) {
            setSelectedVersionCode(versionParam);
        }

        if (gradeParam && !selectedGrade) {
            const grade = GRADES.find(g => g.id === parseInt(gradeParam));
            if (grade) setSelectedGrade(grade);
        }

        if (volumeParam && !selectedVolume) {
            const volume = VOLUMES.find(v => v.id === volumeParam);
            if (volume) setSelectedVolume(volume);
        }
    }, [location, isInitialized, initialData, selectedVersionCode, selectedGrade, selectedVolume]);

    // 当版本、年级、学期都选择后，加载教材数据
    useEffect(() => {
        if (selectedVersionCode && selectedGrade && selectedVolume && isInitialized) {
            loadCatalogData();
        } else {
            setCatalogData(null);
            setShowUnits(false);
        }
    }, [selectedVersionCode, selectedGrade, selectedVolume, isInitialized]);

    // 加载教材数据
    const loadCatalogData = async () => {
        setLoading(true);
        try {
            let currentData = bookManager.getCurrentRawData();

            if (bookManager.getCurrentVersionCode() !== selectedVersionCode) {
                currentData = await bookManager.switchVersion(selectedVersionCode);
            }

            if (currentData && currentData.books) {
                const currentBook = currentData.books.find(book =>
                    book.grade === selectedGrade.id &&
                    book.volume === selectedVolume.id
                );

                if (currentBook) {
                    setCatalogData(currentBook);
                    setShowUnits(true);
                    setCurrentPage(0);
                    // 清空失败图片记录
                    setFailedImages({});
                } else {
                    setCatalogData(null);
                    setShowUnits(false);
                }
            } else {
                setCatalogData(null);
                setShowUnits(false);
            }
        } catch (error) {
            console.error('获取教材数据失败:', error);
            setCatalogData(null);
            setShowUnits(false);
        } finally {
            setLoading(false);
        }
    };

    // 当前页的单元数据
    const currentUnits = useMemo(() => {
        if (!catalogData || !catalogData.units) return [];
        const start = currentPage * itemsPerPage;
        const end = start + itemsPerPage;
        return catalogData.units.slice(start, end);
    }, [catalogData, currentPage, itemsPerPage]);

    // 总页数
    const totalPages = useMemo(() => {
        return catalogData && catalogData.units
            ? Math.ceil(catalogData.units.length / itemsPerPage)
            : 0;
    }, [catalogData, itemsPerPage]);

    // 获取正确的图片路径
    const getImageUrl = useCallback((coverPath) => {
        if (!coverPath) return '';
        if (coverPath.startsWith('http://') || coverPath.startsWith('https://')) {
            return coverPath;
        }
        if (coverPath.startsWith('/')) {
            return `${G_config.G_server_address}${coverPath}`;
        }
        return `${G_config.G_server_address}/${coverPath}`;
    }, []);

    // 获取图片地址（处理失败的情况）
    const getImageSrc = useCallback((unit) => {
        if (failedImages[unit.id]) {
            return DEFAULT_COVER;
        }
        return getImageUrl(unit.cover);
    }, [failedImages, getImageUrl]);

    // 处理图片加载错误
    const handleImageError = useCallback((unitId) => {
        if (!failedImages[unitId]) {
            setFailedImages(prev => ({ ...prev, [unitId]: true }));
        }
    }, [failedImages]);

    // 监听文本选择事件
    useEffect(() => {
        const handleSelectionChange = () => {
            const selection = window.getSelection();
            const selectedText = selection?.toString().trim();

            if (selectedText && selectedText.length > 0 && selectedText.length <= 100) {
                const isEnglish = /^[a-zA-Z\s\-',.!?]+$/.test(selectedText);
                if (isEnglish) {
                    const wordCount = selectedText.split(/\s+/).filter(w => w.length > 0).length;
                    const hasPunctuation = /[.!?]/.test(selectedText);
                    const isLikelySentence = hasPunctuation || wordCount > 7;

                    if (translatorRef.current) {
                        if (isLikelySentence) {
                            translatorRef.current.setSentenceText(selectedText);
                        } else {
                            translatorRef.current.translateText(selectedText);
                        }
                    }

                    if (!translatorOpen) {
                        setTranslatorOpen(true);
                    }
                }
            }
        };

        document.addEventListener('mouseup', handleSelectionChange);
        document.addEventListener('touchend', handleSelectionChange);

        return () => {
            document.removeEventListener('mouseup', handleSelectionChange);
            document.removeEventListener('touchend', handleSelectionChange);
        };
    }, [translatorOpen]);

    // 移除移动端键盘
    useEffect(() => {
        const buttons = document.querySelectorAll('.mobile_keyboard');
        buttons.forEach(button => button.remove());
    }, []);

    // 返回主页（重置所有选择）
    const handleGoHome = useCallback(() => {
        navigate('/');
    }, [navigate]);

    // 层级跳转函数
    const jumpToVersion = useCallback(() => {
        setSelectedVersionCode(null);
        setSelectedGrade(null);
        setSelectedVolume(null);
        setCatalogData(null);
        setShowUnits(false);
        setCurrentPage(0);
        setFailedImages({});
        setVolumeCoverFailed({});
    }, []);

    const jumpToGrade = useCallback(() => {
        setSelectedGrade(null);
        setSelectedVolume(null);
        setCatalogData(null);
        setShowUnits(false);
        setCurrentPage(0);
        setFailedImages({});
        setVolumeCoverFailed({});
    }, []);

    const jumpToVolume = useCallback(() => {
        setSelectedVolume(null);
        setCatalogData(null);
        setShowUnits(false);
        setCurrentPage(0);
        setFailedImages({});
    }, []);

    // 处理版本选择
    const handleVersionSelect = useCallback(async (versionCode) => {
        setLoading(true);
        try {
            if (!bookManager.isLoaded) {
                await bookManager.init('book_versions.json', false);
                const versions = bookManager.getVersionList();
                setVersionList(versions);
            }
            await bookManager.switchVersion(versionCode);
            setSelectedVersionCode(versionCode);
            setSelectedGrade(null);
            setSelectedVolume(null);
            setCatalogData(null);
            setShowUnits(false);
            setCurrentPage(0);
            setFailedImages({});
            setVolumeCoverFailed({});
        } catch (error) {
            console.error('切换版本失败:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // 处理年级选择
    const handleGradeSelect = useCallback((grade) => {
        setSelectedGrade(grade);
        setSelectedVolume(null);
        setCatalogData(null);
        setShowUnits(false);
        setCurrentPage(0);
        setFailedImages({});
        setVolumeCoverFailed({});
    }, []);

    // 处理学期选择
    const handleVolumeSelect = useCallback((volume) => {
        setSelectedVolume(volume);
    }, []);

    // 处理单元点击（进入书本学习）
    const handleBookClick = useCallback((unit) => {
        navigate('/english_book_pic_read/book-learn', {
            state: {
                bookId: catalogData?.id,
                bookName: `${selectedGrade?.name}${selectedVolume?.name}`,
                unitId: unit.id,
                unitName: unit.name,
                pageRange: unit.page_range,
                totalPages: unit.total_pages,
                version: selectedVersionCode,
                grade: selectedGrade?.id,
                volume: selectedVolume?.id,
                returnPath: location.pathname,
                returnState: {
                    version: selectedVersionCode,
                    grade: selectedGrade?.id,
                    volume: selectedVolume?.id
                }
            }
        });
    }, [catalogData, selectedGrade, selectedVolume, selectedVersionCode, navigate, location.pathname]);

    // 处理单词学习点击
    const handleWordClick = useCallback((unit) => {
        navigate('/english_book_pic_read/word-learn', {
            state: {
                unitId: unit.id,
                unitName: unit.name,
                bookId: catalogData?.id,
                version: selectedVersionCode,
                grade: selectedGrade?.id,
                volume: selectedVolume?.id,
                returnPath: location.pathname,
                returnState: {
                    version: selectedVersionCode,
                    grade: selectedGrade?.id,
                    volume: selectedVolume?.id
                }
            }
        });
    }, [catalogData, selectedVersionCode, selectedGrade, selectedVolume, navigate, location.pathname]);

    // 处理单词背诵点击
    const handleWordMemorizeClick = useCallback((unit) => {
        navigate('/english_book_1_work', {
            state: {
                unitId: unit.id,
                unitName: unit.name,
                bookId: catalogData?.id,
                bookName: `${selectedGrade?.name}${selectedVolume?.name}`,
                version: selectedVersionCode,
                grade: selectedGrade?.id,
                volume: selectedVolume?.id,
                textbookInfo: {
                    version: selectedVersion?.name,
                    grade: selectedGrade?.name,
                    volume: selectedVolume?.name,
                    unit: unit.name
                },
                returnPath: location.pathname,
                returnState: {
                    version: selectedVersionCode,
                    grade: selectedGrade?.id,
                    volume: selectedVolume?.id,
                    showUnits: true
                }
            }
        });
    }, [catalogData, selectedVersion, selectedVersionCode, selectedGrade, selectedVolume, navigate, location.pathname]);

    // 切换页码
    const handlePageChange = useCallback((newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // 渲染层级导航
    const renderBreadcrumb = () => {
        const breadcrumbs = [];

        if (selectedVersion) {
            breadcrumbs.push({
                name: selectedVersion.name,
                onClick: jumpToVersion
            });
        }

        if (selectedGrade) {
            breadcrumbs.push({
                name: selectedGrade.name,
                onClick: jumpToGrade
            });
        }

        if (selectedVolume) {
            breadcrumbs.push({
                name: selectedVolume.name,
                onClick: jumpToVolume
            });
        }

        if (breadcrumbs.length === 0) {
            return null;
        }

        return (
            <div className="breadcrumb-nav">
                <span className="breadcrumb-item home" onClick={handleGoHome}>
                    🏠 首页
                </span>
                {breadcrumbs.map((item, index) => (
                    <React.Fragment key={index}>
                        <span className="breadcrumb-separator">›</span>
                        <span className="breadcrumb-item" onClick={item.onClick}>
                            {item.name}
                        </span>
                    </React.Fragment>
                ))}
            </div>
        );
    };

    // 渲染版本选择界面
    const renderVersionSelector = () => (
        <div className="selector-container">
            <div className="selector-header">
                <button className="back-step-btn" onClick={handleGoHome}>
                    ← 返回首页
                </button>
                <h2 className="selector-title">选择教材版本</h2>
            </div>
            <div className="selector-grid">
                {versionList.map(version => (
                    <div
                        key={version.code}
                        className={`selector-card ${selectedVersionCode === version.code ? 'active' : ''}`}
                        onClick={() => handleVersionSelect(version.code)}
                    >
                        <div className="selector-icon">📚</div>
                        <div className="selector-name">{version.name}</div>
                        <div className="selector-code">{version.code.toUpperCase()}</div>
                    </div>
                ))}
            </div>
        </div>
    );

    // 渲染年级选择界面
    const renderGradeSelector = () => (
        <div className="selector-container">
            <div className="selector-header">
                <button className="back-step-btn" onClick={jumpToVersion}>
                    ← 返回
                </button>
                <h2 className="selector-title">{selectedVersion?.name}</h2>
            </div>
            <h3 className="selector-subtitle">选择年级</h3>
            <div className="selector-grid">
                {GRADES.map(grade => (
                    <div
                        key={grade.id}
                        className={`selector-card ${selectedGrade?.id === grade.id ? 'active' : ''}`}
                        onClick={() => handleGradeSelect(grade)}
                    >
                        <div className="selector-icon">🎓</div>
                        <div className="selector-name">{grade.name}</div>
                    </div>
                ))}
            </div>
        </div>
    );

    // 渲染学期选择界面（带小尺寸封面图片）
    const renderVolumeSelector = () => {
        // 获取当前年级下所有学期的教材数据
        const getVolumeBooks = () => {
            if (!bookManager.isLoaded || !selectedVersionCode || !selectedGrade) return {};

            const currentData = bookManager.getCurrentRawData();
            if (!currentData || !currentData.books) return {};

            const result = {};
            currentData.books.forEach(book => {
                if (book.grade === selectedGrade.id) {
                    result[book.volume] = book;
                }
            });
            return result;
        };

        const volumeBooks = getVolumeBooks();

        return (
            <div className="selector-container">
                <div className="selector-header">
                    <button className="back-step-btn" onClick={jumpToGrade}>
                        ← 返回
                    </button>
                    <h2 className="selector-title">{selectedVersion?.name} - {selectedGrade?.name}</h2>
                </div>
                <h3 className="selector-subtitle">选择学期</h3>
                <div className="selector-grid selector-grid-with-images">
                    {VOLUMES.map(volume => {
                        const bookData = volumeBooks[volume.id];
                        // 优先使用教材级别的 cover，如果没有则使用第一个单元的 cover
                        const coverImage = bookData?.cover || bookData?.units?.[0]?.cover;
                        const imageUrl = coverImage ? getImageUrl(coverImage) : null;
                        const isImageFailed = volumeCoverFailed[volume.id];

                        return (
                            <div
                                key={volume.id}
                                className={`selector-card ${selectedVolume?.id === volume.id ? 'active' : ''}`}
                                onClick={() => handleVolumeSelect(volume)}
                            >
                                <div className="selector-cover">
                                    {imageUrl && !isImageFailed ? (
                                        <img
                                            src={imageUrl}
                                            alt={volume.name}
                                            className="volume-cover-img"
                                            style={{
                                                width: '100px',
                                                height: '140px',
                                                objectFit: 'cover',
                                                borderRadius: '6px'
                                            }}
                                            onError={() => {
                                                setVolumeCoverFailed(prev => ({ ...prev, [volume.id]: true }));
                                            }}
                                        />
                                    ) : (
                                        <div className="selector-icon" style={{ fontSize: '36px' }}>📖</div>
                                    )}
                                </div>
                                <div className="selector-name">{volume.name}</div>
                                {bookData && (
                                    <div className="selector-info">
                                        {bookData.units?.length || 0} 个单元
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // 渲染单元列表
    const renderUnitList = () => (
        <>
            <div className="units-header">
                {renderBreadcrumb()}
            </div>
            <div className="book-header">
                <h2 className="book-title">
                    {selectedVersion?.name} {selectedGrade?.name}{selectedVolume?.name}
                </h2>
                <p className="book-info">
                    共 {catalogData?.units.length} 个单元 | 每页 {itemsPerPage} 个单元
                </p>
            </div>
            <div className="units-container">
                {currentUnits.length > 0 ? (
                    currentUnits.map((unit) => (
                        <div key={unit.id} className="unit-item">
                            <h4 className="unit-title">
                                {unit.order + 1}. {unit.name}
                            </h4>
                            <div className="unit-content">
                                <div className="unit-card">
                                    <img
                                        className="unit-cover"
                                        onClick={() => handleBookClick(unit)}
                                        src={getImageSrc(unit)}
                                        alt={unit.name}
                                        style={{
                                            width: '200px',
                                            height: '280px',
                                            objectFit: 'cover',
                                            cursor: 'pointer',
                                            borderRadius: '8px'
                                        }}
                                        onError={() => handleImageError(unit.id)}
                                    />
                                    <div className="unit-info">
                                        <div className="page-info">
                                            <span className="label">页码范围:</span>
                                            <span className="value">
                                                第 {unit.page_range[0]} - {unit.page_range[1]} 页
                                            </span>
                                        </div>
                                        <div className="total-pages-info">
                                            <span className="label">总页数:</span>
                                            <span className="value">{unit.total_pages} 页</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <p>暂无单元数据</p>
                    </div>
                )}
            </div>
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="page-btn prev"
                        onClick={() => handlePageChange(Math.max(currentPage - 1, 0))}
                        disabled={currentPage === 0}
                    >
                        ← 上一页
                    </button>
                    <span className="page-info">
                        第 {currentPage + 1} 页 / 共 {totalPages} 页
                    </span>
                    <button
                        className="page-btn next"
                        onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages - 1))}
                        disabled={currentPage >= totalPages - 1}
                    >
                        下一页 →
                    </button>
                </div>
            )}
        </>
    );

    // 加载中状态
    if (loading && !isInitialized) {
        return (
            <div className='R_select_content'>
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <div className="loading-text">加载中...</div>
                </div>
            </div>
        );
    }

    // 渲染主界面
    return (
        <div className='R_select_content'>
            {/* 顶部按钮组 */}
            <div style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 1000,
                display: 'flex',
                gap: '12px'
            }}>
               <button
    onClick={() => navigate('/sentence_listen')}
    className='memorize-btn'
    style={{
        backgroundColor: '#2d2d2d',
        color: '#cccccc',
        border: '1px solid #3e3e42',
        borderRadius: '6px',
        padding: '10px 20px',
        fontSize: '14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.3s ease'
    }}
    onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#3e3e42';
        e.target.style.borderColor = '#0e639c';
        e.target.style.color = '#ffffff';
        e.target.style.transform = 'scale(1.05)';
    }}
    onMouseLeave={(e) => {
        e.target.style.backgroundColor = '#2d2d2d';
        e.target.style.borderColor = '#3e3e42';
        e.target.style.color = '#cccccc';
        e.target.style.transform = 'scale(1)';
    }}
    title="听力听写中心"
>
    📚 听力听写
</button>
                <button
                    onClick={() => navigate('/english_book_1_work')}
                    className='memorize-btn'
                    style={{
                        backgroundColor: '#2d2d2d',
                        color: '#cccccc',
                        border: '1px solid #3e3e42',
                        borderRadius: '6px',
                        padding: '10px 20px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#3e3e42';
                        e.target.style.borderColor = '#0e639c';
                        e.target.style.color = '#ffffff';
                        e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#2d2d2d';
                        e.target.style.borderColor = '#3e3e42';
                        e.target.style.color = '#cccccc';
                        e.target.style.transform = 'scale(1)';
                    }}
                    title="单词背诵中心"
                >
                    📚 单词背诵
                </button>
                <button
                    onClick={handleGoHome}
                    className='home-btn'
                    style={{
                        backgroundColor: '#0e639c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '10px 20px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#1177bb';
                        e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#0e639c';
                        e.target.style.transform = 'scale(1)';
                    }}
                    title="返回主页"
                >
                    🏠 主页
                </button>
            </div>

            {/* 翻译器按钮 */}
            <button
                onClick={() => setTranslatorOpen(true)}
                className='translator-btn'
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 1000,
                    backgroundColor: '#2d2d2d',
                    color: '#cccccc',
                    border: '1px solid #3e3e42',
                    borderRadius: '50%',
                    width: '60px',
                    height: '60px',
                    fontSize: '24px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#3e3e42';
                    e.target.style.borderColor = '#0e639c';
                    e.target.style.color = '#ffffff';
                    e.target.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#2d2d2d';
                    e.target.style.borderColor = '#3e3e42';
                    e.target.style.color = '#cccccc';
                    e.target.style.transform = 'scale(1)';
                }}
                title="打开翻译器"
            >
                🔍
            </button>

            {/* 条件渲染：显示哪个界面 */}
            {versionList.length > 0 && !selectedVersionCode && renderVersionSelector()}
            {selectedVersionCode && !selectedGrade && renderGradeSelector()}
            {selectedVersionCode && selectedGrade && !selectedVolume && renderVolumeSelector()}
            {selectedVersionCode && selectedGrade && selectedVolume && showUnits && renderUnitList()}

            {/* 翻译器组件 */}
            {/* <WordTranslator
                ref={translatorRef}
                open={translatorOpen}
                onClose={() => setTranslatorOpen(false)}
                defaultCompact={true}
                enableClipboardDetection={true}
                onRequestOpen={() => setTranslatorOpen(true)}
                word="Hello world. How are you? I am fine."
            /> */}
        </div>
    );
};

export default R_select_content;