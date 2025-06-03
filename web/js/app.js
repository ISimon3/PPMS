// Global Variables
let currentTheme = 'light';
let tasksList = [];
let accountsList = [];
let projectsList = [];
let paymentsList = [];
let settings = {};
let clientsList = []; // 客户列表
let categoriesList = []; // 任务类别列表
let websitesList = []; // 网站类型列表

// 当前确认对话框回调函数
let currentConfirmCallback = null;

// DOM Elements
let sidebar, sidebarToggle, pageTitle, pageContents, navItems, themeIcon, currentDateElement;

// 初始化API连接
function initApiConnection() {
    console.log('正在初始化API连接...');
    
    // 检查API是否可用
    if (!window.pywebview) {
        console.warn('PyWebView未加载，可能在浏览器环境中运行');
        // 在浏览器环境中，添加模拟API以便测试UI
        window.pywebview = {
            api: {
                // 添加一些模拟API函数用于开发测试
                get_settings: () => Promise.resolve({ theme: 'light' }),
                get_tasks: () => Promise.resolve([]),
                get_accounts: () => Promise.resolve([]),
                get_projects: () => Promise.resolve([]),
                get_payments: () => Promise.resolve([]),
                get_websites: () => Promise.resolve([]),
                get_clients: () => Promise.resolve([]),
                get_categories: () => Promise.resolve([])
            }
        };
    }
    
    // 等待API就绪
    const maxRetries = 10;
    let retries = 0;
    
    return new Promise((resolve, reject) => {
        function checkApi() {
            if (window.pywebview && window.pywebview.api) {
                console.log('PyWebView API已就绪');
                resolve(true);
                return;
            }
            
            retries++;
            if (retries >= maxRetries) {
                console.error('PyWebView API初始化超时');
                reject(new Error('API初始化超时'));
                return;
            }
            
            console.log(`等待API就绪...尝试 ${retries}/${maxRetries}`);
            setTimeout(checkApi, 500);
        }
        
        // 开始检查
        checkApi();
    });
}

// 页面加载完成后的初始化函数
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM已加载，开始初始化应用...');
    
    try {
        // 初始化DOM元素引用
        sidebar = document.getElementById('sidebar');
        sidebarToggle = document.getElementById('sidebar-toggle');
        pageTitle = document.getElementById('page-title');
        navItems = document.querySelectorAll('.nav-item');
        themeIcon = document.querySelector('.theme-icon');
        currentDateElement = document.getElementById('current-date');
        
        // 检查必要的DOM元素是否存在
        if (!sidebar) console.warn('侧边栏元素不存在');
        if (!sidebarToggle) console.warn('侧边栏切换按钮不存在');
        if (!pageTitle) console.warn('页面标题元素不存在');
        if (!navItems || navItems.length === 0) console.warn('导航项元素不存在');
        
        console.log('DOM元素初始化完成');
        
        // 初始化API连接
        initApiConnection()
            .then(() => {
                console.log('API连接成功，初始化应用组件...');
                
                // 初始化主题
                initTheme();
                
                // 初始化侧边栏
                initSidebar();
                
                // 初始化导航
                initNavigation();
                
                // 加载设置
                loadSettings();
                
                // 显示当前日期
                updateCurrentDate();
                
                // 初始化用户资料（保证侧边栏和设置页都能显示最新头像和用户名）
                loadUserProfile();
                
                // 初始化页面
                const savedPage = localStorage.getItem('ppms-current-page') || 'tasks';
                console.log(`正在加载保存的页面: ${savedPage}`);
                navigateTo(savedPage);
                
                console.log('应用初始化完成');
            })
            .catch(error => {
                console.error('API初始化失败:', error);
                
                // 显示错误通知
                showErrorNotification('API初始化失败，请重启应用');
                
                // 仍然尝试初始化UI，但功能可能受限
                initTheme();
                initSidebar();
                initNavigation();
                updateCurrentDate();
            });
    } catch (error) {
        console.error('应用初始化过程中发生错误:', error);
        showErrorNotification('应用初始化失败，请重启应用');
    }
});

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize DOM elements
    sidebar = document.getElementById('sidebar');
    sidebarToggle = document.getElementById('sidebar-toggle');
    pageTitle = document.getElementById('page-title');
    pageContents = document.querySelectorAll('.page-content');
    navItems = document.querySelectorAll('.nav-item');
    themeIcon = document.getElementById('theme-icon'); // 修正themeIcon选择器
    currentDateElement = document.getElementById('current-date');
    
    // Update date display
    updateDateDisplay();
    setInterval(updateDateDisplay, 60000);
    
    // Load settings
    loadSettings();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up modal accessibility fixes
    setupModalAccessibility();
    
    // Setup payments event listeners
    setupPaymentsEventListeners();
    
    // Add PyWebView ready event listener
    window.addEventListener('pywebviewready', function() {
        console.log('PyWebView is ready');
        // Load initial data
        loadTasksData();
        
        // Set up chart.js
        setupCharts();
    });
    
    // If pywebview is already ready, initialize data
    if (window.pywebview) {
        console.log('PyWebView already available');
        // Load initial data
        loadTasksData();
        
        // Set up chart.js
        setupCharts();
    }
    
    // 设置当前日期
    updateCurrentDate();
    
    // 侧边栏切换
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // 导航项点击事件
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            navigateTo(page);
        });
    });
    
    // 初始化主题
    initTheme();
    
    // 初始化主题切换开关
    initThemeSwitch();
    
    // 初始化各页面功能
    initTasksPage();
    initAccountsPage();
    initProjectsPage();
    initPaymentsPage();
    initReportsPage();
    
    // 加载设置
    loadSettings();
});

// Setup Modal Accessibility
function setupModalAccessibility() {
    // Fix focus management for all modals
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        // Store the element that opened the modal to return focus to it
        let previousFocusElement;
        
        // Before modal is shown, store the current active element
        modal.addEventListener('show.bs.modal', function() {
            previousFocusElement = document.activeElement;
        });
        
        // When modal is hidden, return focus to the element that opened it
        modal.addEventListener('hidden.bs.modal', function() {
            // Move focus back to the element that opened the modal
            if (previousFocusElement && previousFocusElement.focus) {
                // Small timeout to ensure the modal is fully hidden
                setTimeout(() => {
                    previousFocusElement.focus();
                }, 10);
            } else {
                // If no previous element, focus on a safe element like the page title
                const safeElement = document.getElementById('page-title');
                if (safeElement) {
                    safeElement.focus();
                }
            }
        });
        
        // Handle tab key within modal to prevent tabbing outside the modal
        modal.addEventListener('keydown', function(event) {
            if (event.key === 'Tab') {
                const focusableElements = modal.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                
                if (focusableElements.length === 0) return;
                
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];
                
                // If shift+tab on first element, move to last element
                if (event.shiftKey && document.activeElement === firstElement) {
                    lastElement.focus();
                    event.preventDefault();
                }
                // If tab on last element, move to first element
                else if (!event.shiftKey && document.activeElement === lastElement) {
                    firstElement.focus();
                    event.preventDefault();
                }
            }
        });
    });
}

// Event Listeners Setup
function setupEventListeners() {
    // Sidebar toggle
    sidebarToggle.addEventListener('click', toggleSidebar);
    
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetPage = item.getAttribute('data-page');
            changePage(targetPage, item);
        });
    });
    
    // 导出数据按钮事件监听
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    // Task-related event listeners
    setupTaskEventListeners();
    
    // Account-related event listeners
    setupAccountEventListeners();
    
    // Project-related event listeners
    setupProjectEventListeners();
    
    // 客户管理按钮
    const manageClientsBtn = document.getElementById('manage-clients-btn');
    if (manageClientsBtn) {
        manageClientsBtn.addEventListener('click', openClientsModal);
    }
    
    // 项目类型管理按钮
    const manageCategoriesBtn = document.getElementById('manage-categories-btn');
    if (manageCategoriesBtn) {
        manageCategoriesBtn.addEventListener('click', openCategoriesModal);
    }
    
    // 重启应用按钮
    const restartAppBtn = document.getElementById('restart-app-btn');
    if (restartAppBtn) {
        restartAppBtn.addEventListener('click', restartApplication);
    }
    
    // 通用设置开关事件
    const autostartSwitch = document.getElementById('autostart-switch');
    if (autostartSwitch) {
        autostartSwitch.addEventListener('change', function() {
            if (!window.pywebview) return;
            window.pywebview.api.update_settings({ autostart: this.checked ? 1 : 0 }).then(() => {
                showAlert('开机自启设置已更新', '设置');
                loadSettings(); // 切换后刷新
            });
        });
    }
    const minimizeToTraySwitch = document.getElementById('minimize-to-tray-switch');
    if (minimizeToTraySwitch) {
        minimizeToTraySwitch.addEventListener('change', function() {
            if (!window.pywebview) return;
            window.pywebview.api.update_settings({ minimize_to_tray: this.checked ? 1 : 0 }).then(() => {
                showAlert('最小化到托盘设置已更新，需要重启应用才能生效', '设置');
                loadSettings(); // 立即刷新开关状态
                // 不再自动重启，由用户自行决定
            });
        });
    }
}

// Change page function
function changePage(pageName, navItem) {
    // Update navigation
    navItems.forEach(item => item.classList.remove('active'));
    navItem.classList.add('active');
    
    // Update page title
    pageTitle.textContent = navItem.querySelector('a').textContent.trim();
    
    // Show the selected page
    pageContents.forEach(page => {
        page.classList.remove('active');
        if (page.id === `${pageName}-page`) {
            page.classList.add('active');
        }
    });
    
    // 记录最后一次访问的页面
    localStorage.setItem('lastVisitedPage', pageName);
    
    // Load page-specific data
    switch (pageName) {
        case 'tasks':
            loadTasksData();
            break;
        case 'reports':
            setupTaskReportCharts('week');
            break;
        case 'accounts':
            loadAccountsData();
            break;
        case 'projects':
            loadProjectsData();
            break;
        case 'payments':
            loadPaymentsData();
            break;
        case 'settings':
            // 进入设置页面时强制刷新设置和用户资料
            loadSettings();
            loadUserProfile();
            break;
    }
}

// Date display function
function updateDateDisplay() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateElement.textContent = now.toLocaleDateString('zh-CN', options);
}

// Load settings
function loadSettings() {
    try {
        safeApiCall('get_settings')
            .then(settings => {
                console.log('加载设置:', settings);
                
                // 应用主题
                currentTheme = settings.theme || 'light';
                document.body.setAttribute('data-theme', currentTheme);
                console.log('应用主题设置:', currentTheme);
                
                // 更新主题图标
                updateThemeIcons();
                
                // 同步通用设置开关
                const autostartSwitch = document.getElementById('autostart-switch');
                if (autostartSwitch) {
                    autostartSwitch.checked = !!settings.autostart;
                }
                const minimizeToTraySwitch = document.getElementById('minimize-to-tray-switch');
                if (minimizeToTraySwitch) {
                    minimizeToTraySwitch.checked = !!settings.minimize_to_tray;
                }
            })
            .catch(error => {
                console.error('加载设置失败:', error);
            });
    } catch (e) {
        console.log('Running in browser mode, using default settings');
    }
}

// Setup Chart.js
function setupCharts() {
    // 初始化图表
    setupTaskReportCharts('week'); // 默认显示周报告
    
    // 添加报告周期切换事件
    const periodButtons = document.querySelectorAll('.period-selector button');
    if (periodButtons) {
        periodButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                // 移除所有按钮的激活状态
                periodButtons.forEach(b => b.classList.remove('active'));
                // 激活当前按钮
                this.classList.add('active');
                // 获取周期类型并更新图表
                const period = this.getAttribute('data-period');
                setupTaskReportCharts(period);
            });
        });
    }
    
    // 设置定时刷新（每60秒刷新一次）
    setInterval(() => {
        const activePeriod = document.querySelector('.period-selector button.active');
        if (activePeriod) {
            const period = activePeriod.getAttribute('data-period');
            setupTaskReportCharts(period);
        }
    }, 60000);
}

// 设置任务报告图表
function setupTaskReportCharts(period) {
    if (!window.pywebview) {
        console.warn('PyWebView API not available yet, cannot load report data');
        return;
    }
    
    // 显示加载状态
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        container.classList.add('loading');
    });
    
    // 获取所有任务数据
    window.pywebview.api.get_tasks().then(tasks => {
        // 获取所有项目数据（包括已归档和未归档的）
        window.pywebview.api.get_projects(true).then(archivedProjects => {
            window.pywebview.api.get_projects(false).then(activeProjects => {
                // 合并所有项目
                const allProjects = [...activeProjects];
                archivedProjects.forEach(archivedProject => {
                    if (!allProjects.some(p => p.id === archivedProject.id)) {
                        allProjects.push(archivedProject);
                    }
                });
                
                console.log('报告 - 获取到未归档项目:', activeProjects.length);
                console.log('报告 - 获取到归档项目:', archivedProjects.length);
                console.log('报告 - 合并后总项目数:', allProjects.length);
                
                // 调用各个图表函数并传递任务和所有项目数据
                updateTasksStatistics(tasks, allProjects, period);
                createTaskStatusChart(tasks, allProjects, period);
                createTaskTypeDistributionChart(allProjects, period);
                createTaskTrendChart(tasks, allProjects, period);
                
                // 移除加载状态
                chartContainers.forEach(container => {
                    container.classList.remove('loading');
                });
            }).catch(error => {
                console.error('获取未归档项目数据失败:', error);
                // 移除加载状态
                chartContainers.forEach(container => {
                    container.classList.remove('loading');
                });
            });
        }).catch(error => {
            console.error('获取归档项目数据失败:', error);
            // 移除加载状态
            chartContainers.forEach(container => {
                container.classList.remove('loading');
            });
        });
    }).catch(error => {
        console.error('获取任务数据失败:', error);
        // 移除加载状态
        chartContainers.forEach(container => {
            container.classList.remove('loading');
        });
    });
}

// 更新任务统计信息
function updateTasksStatistics(tasks, projects, period) {
    // 过滤掉已删除的任务
    const activeTasks = tasks.filter(task => !(task.is_deleted === true || task.status === 'deleted'));
    
    // 根据周期过滤数据
    const { startDate, endDate } = getDateRangeByPeriod(period);
    
    // 获取所有项目数据（包括已归档和未归档的）
    window.pywebview.api.get_projects(true).then(archivedProjects => {
        window.pywebview.api.get_projects(false).then(activeProjects => {
            // 合并所有项目
            const allProjects = [...activeProjects];
            archivedProjects.forEach(archivedProject => {
                if (!allProjects.some(p => p.id === archivedProject.id)) {
                    allProjects.push(archivedProject);
                }
            });
            
            console.log('任务统计 - 获取到未归档项目:', activeProjects.length);
            console.log('任务统计 - 获取到归档项目:', archivedProjects.length);
            console.log('任务统计 - 合并后总项目数:', allProjects.length);
            
            // 计算总统计数据（不受时间范围限制）
            const totalCompletedProjects = allProjects.length;
            const totalSettledProjects = allProjects.filter(p => p.payment_status === 'paid').length;
            const settlementRate = totalCompletedProjects > 0 ? Math.round((totalSettledProjects / totalCompletedProjects) * 100) : 0;
            
            // 过滤指定时间范围内的任务（不包括已删除的）
            const filteredActiveTasks = activeTasks.filter(task => {
                const taskDate = task.created_at ? new Date(task.created_at) : null;
                return taskDate && taskDate >= startDate && taskDate <= endDate;
            });
            
            // 过滤指定时间范围内的已完成项目
            const filteredProjects = allProjects.filter(project => {
                const projectDate = project.completion_date ? new Date(project.completion_date) : null;
                return projectDate && projectDate >= startDate && projectDate <= endDate;
            });
            
            // 计算活跃天数（有任务创建或项目完成的天数）
            const activeDaysSet = new Set();
            
            // 添加任务创建日期
            filteredActiveTasks.forEach(task => {
                if (task.created_at) {
                    const date = new Date(task.created_at).toLocaleDateString();
                    activeDaysSet.add(date);
                }
            });
            
            // 添加项目完成日期
            filteredProjects.forEach(project => {
                if (project.completion_date) {
                    const date = new Date(project.completion_date).toLocaleDateString();
                    activeDaysSet.add(date);
                }
            });
            
            const activeDays = activeDaysSet.size;
            
            // 更新页面显示
            document.getElementById('completed-tasks').textContent = totalCompletedProjects; // 总完成项目数
            document.getElementById('settled-tasks').textContent = totalSettledProjects; // 总结算项目数
            document.getElementById('settlement-rate').textContent = `${settlementRate}%`;
            document.getElementById('active-days').textContent = activeDays;
            
            console.log('任务统计:', {
                已完成项目: totalCompletedProjects,
                已结算项目: totalSettledProjects,
                结算率: `${settlementRate}%`,
                活跃天数: activeDays
            });
        }).catch(error => {
            console.error('获取未归档项目数据失败:', error);
        });
    }).catch(error => {
        console.error('获取归档项目数据失败:', error);
    });
}

// 创建任务状态分布图表
function createTaskStatusChart(tasks, projects, period) {
    // 过滤掉已删除的任务
    const activeTasks = tasks.filter(task => !(task.is_deleted === true || task.status === 'deleted'));
    
    // 根据周期过滤数据
    const { startDate, endDate } = getDateRangeByPeriod(period);
    
    // 获取所有项目数据（包括已归档的和未归档的）
    window.pywebview.api.get_projects(true).then(archivedProjects => {
        window.pywebview.api.get_projects(false).then(activeProjects => {
            // 合并所有项目
            const allProjects = [...activeProjects];
            archivedProjects.forEach(archivedProject => {
                if (!allProjects.some(p => p.id === archivedProject.id)) {
                    allProjects.push(archivedProject);
                }
            });
            
            console.log('获取到未归档项目:', activeProjects.length);
            console.log('获取到归档项目:', archivedProjects.length);
            console.log('合并后总项目数:', allProjects.length);
            
            // 统计不同状态的任务数量
            const statusCounts = {
                'pending': 0,
                'in-progress': 0,
                'completed': 0,
                'settled': 0
            };
            
            // 过滤指定时间范围内的任务
            const filteredTasks = activeTasks.filter(task => {
                const taskDate = task.created_at ? new Date(task.created_at) : null;
                return taskDate && taskDate >= startDate && taskDate <= endDate;
            });
            
            // 统计未完成任务的数量
            filteredTasks.forEach(task => {
                const status = task.status || 'pending';
                if (status === 'pending' || status === 'in-progress') {
                    statusCounts[status]++;
                }
            });
            
            // 统计已完成的项目数量 - 所有项目都算作已完成
            statusCounts.completed = allProjects.length;
            
            // 统计已结算的项目数量
            statusCounts.settled = allProjects.filter(p => p.payment_status === 'paid').length;
            
            console.log('任务状态分布:', statusCounts);
            
            // 确保有任务数据
            if (filteredTasks.length === 0 && allProjects.length === 0) {
                // 获取图表Canvas
                const chartCanvas = document.getElementById('tasks-status-chart');
                if (!chartCanvas) return;
                
                // 销毁现有图表（如果存在）
                if (window.tasksStatusChart) {
                    window.tasksStatusChart.destroy();
                }
                
                // 创建空图表
                window.tasksStatusChart = new Chart(chartCanvas, {
                    type: 'doughnut',
                    data: {
                        labels: ['暂无数据'],
                        datasets: [{
                            data: [1],
                            backgroundColor: ['#e9ecef'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                display: true
                            },
                            tooltip: {
                                enabled: false
                            }
                        }
                    }
                });
                return;
            }
            
            // 准备图表数据
            const chartData = {
                labels: ['待办', '进行中', '已完成', '已结算'],
                datasets: [{
                    data: [
                        statusCounts.pending, 
                        statusCounts['in-progress'], 
                        statusCounts.completed, 
                        statusCounts.settled
                    ],
                    backgroundColor: ['#6c757d', '#4361ee', '#4cc9f0', '#28a745'],
                    borderWidth: 0
                }]
            };
            
            // 获取图表Canvas
            const chartCanvas = document.getElementById('tasks-status-chart');
            if (!chartCanvas) return;
            
            // 销毁现有图表（如果存在）
            if (window.tasksStatusChart) {
                window.tasksStatusChart.destroy();
            }
            
            // 创建新图表
            window.tasksStatusChart = new Chart(chartCanvas, {
                type: 'doughnut',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                boxWidth: 15,
                                padding: 15,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            position: 'nearest',
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }).catch(error => {
            console.error('获取未归档项目数据失败:', error);
        });
    }).catch(error => {
        console.error('获取归档项目数据失败:', error);
    });
}

// 创建任务类型分布图表
function createTaskTypeDistributionChart(projects, period) {
    // 根据周期过滤数据
    const { startDate, endDate } = getDateRangeByPeriod(period);
    
    // 获取所有项目数据（包括已归档和未归档的）
    window.pywebview.api.get_projects(true).then(archivedProjects => {
        window.pywebview.api.get_projects(false).then(activeProjects => {
            // 合并所有项目
            const allProjects = [...activeProjects];
            archivedProjects.forEach(archivedProject => {
                if (!allProjects.some(p => p.id === archivedProject.id)) {
                    allProjects.push(archivedProject);
                }
            });
            
            console.log('类型分布 - 获取到未归档项目:', activeProjects.length);
            console.log('类型分布 - 获取到归档项目:', archivedProjects.length);
            console.log('类型分布 - 合并后总项目数:', allProjects.length);
            
            // 统计不同类型的项目数量
            const typeCounts = {};
            
            // 统计所有项目的类型分布（不受时间范围限制）
            allProjects.forEach(project => {
                const type = project.type || '未分类';
                if (!typeCounts[type]) {
                    typeCounts[type] = 0;
                }
                typeCounts[type]++;
            });
            
            // 获取图表Canvas
            const chartCanvas = document.getElementById('tasks-type-chart');
            if (!chartCanvas) return;
            
            // 销毁现有图表（如果存在）
            if (window.tasksTypeChart) {
                window.tasksTypeChart.destroy();
            }
            
            // 确保有数据
            if (Object.keys(typeCounts).length === 0) {
                // 创建空图表
                window.tasksTypeChart = new Chart(chartCanvas, {
                    type: 'pie',
                    data: {
                        labels: ['暂无数据'],
                        datasets: [{
                            data: [1],
                            backgroundColor: ['#e9ecef'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: {
                                position: 'right',
                                display: true
                            },
                            tooltip: {
                                enabled: false
                            }
                        }
                    }
                });
                return;
            }
            
            // 准备图表数据
            const labels = Object.keys(typeCounts);
            const data = Object.values(typeCounts);
            
            // 生成颜色
            const backgroundColors = generateChartColors(labels.length);
            
            const chartData = {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 0
                }]
            };
            
            // 创建新图表
            window.tasksTypeChart = new Chart(chartCanvas, {
                type: 'pie',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            display: true,
                            labels: {
                                boxWidth: 15,
                                padding: 15,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }).catch(error => {
            console.error('获取未归档项目数据失败:', error);
        });
    }).catch(error => {
        console.error('获取归档项目数据失败:', error);
    });
}

// 创建任务趋势图表
function createTaskTrendChart(tasks, projects, period) {
    // 过滤掉已删除的任务
    const activeTasks = tasks.filter(task => !(task.is_deleted === true || task.status === 'deleted'));
    
    // 根据周期确定日期格式和标签间隔
    let dateFormat, labelStep;
    switch (period) {
        case 'week':
            dateFormat = 'MM-dd';
            labelStep = 1; // 每天显示一个标签
            break;
        case 'month':
            dateFormat = 'MM-dd';
            labelStep = 2; // 每两天显示一个标签
            break;
        case 'year':
            dateFormat = 'yyyy-MM';
            labelStep = 1; // 每月显示一个标签
            break;
        default:
            dateFormat = 'MM-dd';
            labelStep = 1;
    }
    
    // 获取日期范围
    const { startDate, endDate, dateLabels } = getDateRangeByPeriod(period);
    
    // 获取所有项目数据（包括已归档和未归档的）以及结算数据
    window.pywebview.api.get_projects(true).then(archivedProjects => {
        window.pywebview.api.get_projects(false).then(activeProjects => {
            // 合并所有项目
            const allProjects = [...activeProjects];
            archivedProjects.forEach(archivedProject => {
                if (!allProjects.some(p => p.id === archivedProject.id)) {
                    allProjects.push(archivedProject);
                }
            });
            
            console.log('趋势图 - 获取到未归档项目:', activeProjects.length);
            console.log('趋势图 - 获取到归档项目:', archivedProjects.length);
            console.log('趋势图 - 合并后总项目数:', allProjects.length);
            
            window.pywebview.api.get_payments().then(payments => {
                console.log("获取到结算数据:", payments.length);
                
                // 初始化数据数组
                const createdTasksData = new Array(dateLabels.length).fill(0);
                const completedTasksData = new Array(dateLabels.length).fill(0);
                const settledTasksData = new Array(dateLabels.length).fill(0);
                
                // 统计所有项目（包括已归档和未归档）
                allProjects.forEach(project => {
                    if (project.completion_date) {
                        const projectDate = new Date(project.completion_date);
                        if (projectDate >= startDate && projectDate <= endDate) {
                            const index = getDateIndex(projectDate, startDate, period);
                            if (index >= 0 && index < completedTasksData.length) {
                                completedTasksData[index]++;
                                // 同时添加一个创建任务，确保数据匹配
                                createdTasksData[index]++;
                            }
                        }
                    }
                });
                
                // 统计每天结算的任务数量
                payments.forEach(payment => {
                    if (payment.date) {
                        const paymentDate = new Date(payment.date);
                        if (paymentDate >= startDate && paymentDate <= endDate) {
                            const index = getDateIndex(paymentDate, startDate, period);
                            if (index >= 0 && index < settledTasksData.length) {
                                settledTasksData[index]++;
                            }
                        }
                    }
                });
                
                // 计算总数
                const totalCompletedProjects = completedTasksData.reduce((a, b) => a + b, 0);
                const totalSettledProjects = settledTasksData.reduce((a, b) => a + b, 0);
                
                console.log("趋势图数据统计:", {
                    完成项目: totalCompletedProjects,
                    结算项目: totalSettledProjects
                });
                
                // 准备图表数据
                const chartData = {
                    labels: dateLabels,
                    datasets: [
                        {
                            label: '完成项目',
                            data: completedTasksData,
                            borderColor: '#4cc9f0',
                            backgroundColor: 'rgba(76, 201, 240, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: '结算项目',
                            data: settledTasksData,
                            borderColor: '#f72585',
                            backgroundColor: 'rgba(247, 37, 133, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        }
                    ]
                };
                
                // 获取图表Canvas
                const chartCanvas = document.getElementById('tasks-trend-chart');
                if (!chartCanvas) return;
                
                // 销毁现有图表（如果存在）
                if (window.tasksTrendChart) {
                    window.tasksTrendChart.destroy();
                }
                
                // 创建新图表
                window.tasksTrendChart = new Chart(chartCanvas, {
                    type: 'line',
                    data: chartData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                ticks: {
                                    maxRotation: 0,
                                    autoSkip: true,
                                    maxTicksLimit: 10
                                },
                                grid: {
                                    display: false
                                }
                            },
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    precision: 0
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                position: 'top',
                                align: 'end'
                            },
                            tooltip: {
                                mode: 'index',
                                intersect: false,
                                position: 'nearest'
                            }
                        },
                        interaction: {
                            mode: 'index',
                            intersect: false
                        }
                    }
                });
            }).catch(error => {
                console.error('获取结算数据失败:', error);
            });
        }).catch(error => {
            console.error('获取未归档项目数据失败:', error);
        });
    }).catch(error => {
        console.error('获取归档项目数据失败:', error);
    });
}

// 根据周期获取日期范围
function getDateRangeByPeriod(period) {
    const now = new Date();
    let startDate, endDate;
    let dateLabels = [];
    
    switch (period) {
        case 'week':
            // 本周（周一到周日）
            startDate = new Date(now);
            // 获取当前是周几（0是周日，1-6是周一到周六）
            const dayOfWeek = startDate.getDay();
            // 计算本周一的日期（如果今天是周日，则减去6天，如果是周一到周六，则减去对应天数）
            const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            startDate.setDate(startDate.getDate() - daysToSubtract);
            
            // 设置为一天的开始（0时0分0秒）
            startDate.setHours(0, 0, 0, 0);
            
            // 本周日
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            
            // 生成周一到周日的日期标签
            for (let i = 0; i < 7; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                dateLabels.push(formatDateLabel(date, 'MM-dd'));
            }
            break;
            
        case 'month':
            // 当前月（1号到月末）
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            
            // 下个月的第0天就是这个月的最后一天
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
            
            // 计算当月的天数
            const daysInMonth = endDate.getDate();
            
            // 生成当月所有日期的标签
            for (let i = 0; i < daysInMonth; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                dateLabels.push(formatDateLabel(date, 'MM-dd'));
            }
            break;
            
        case 'year':
            // 当年（1月1日到12月31日）
            startDate = new Date(now.getFullYear(), 0, 1);
            startDate.setHours(0, 0, 0, 0);
            
            endDate = new Date(now.getFullYear(), 11, 31);
            endDate.setHours(23, 59, 59, 999);
            
            // 生成1月到12月的标签
            for (let i = 0; i < 12; i++) {
                const date = new Date(now.getFullYear(), i, 1);
                dateLabels.push(formatDateLabel(date, 'yyyy-MM'));
            }
            break;
            
        default:
            // 默认为周报告
            startDate = new Date(now);
            const defaultDayOfWeek = startDate.getDay();
            const defaultDaysToSubtract = defaultDayOfWeek === 0 ? 6 : defaultDayOfWeek - 1;
            startDate.setDate(startDate.getDate() - defaultDaysToSubtract);
            startDate.setHours(0, 0, 0, 0);
            
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            
            // 生成周一到周日的日期标签
            for (let i = 0; i < 7; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                dateLabels.push(formatDateLabel(date, 'MM-dd'));
            }
    }
    
    return { startDate, endDate, dateLabels };
}

// 获取日期在数组中的索引
function getDateIndex(date, startDate, period) {
    switch (period) {
        case 'week':
        case 'month':
            // 计算天数差
            return Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
        case 'year':
            // 计算月份差
            return (date.getFullYear() - startDate.getFullYear()) * 12 + date.getMonth() - startDate.getMonth();
        default:
            return 0;
    }
}

// 格式化日期标签
function formatDateLabel(date, format) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    switch (format) {
        case 'MM-dd':
            return `${month}-${day}`;
        case 'yyyy-MM':
            return `${year}-${month}`;
        default:
            return `${year}-${month}-${day}`;
    }
}

// 生成图表颜色
function generateChartColors(count) {
    const baseColors = [
        '#4361ee', // 蓝色
        '#4cc9f0', // 浅蓝色
        '#f72585', // 粉色
        '#7209b7', // 紫色
        '#3f37c9', // 深蓝色
        '#4895ef', // 天蓝色
        '#560bad', // 深紫色
        '#f15bb5', // 亮粉色
        '#00bbf9', // 亮蓝色
        '#00f5d4'  // 青绿色
    ];
    
    // 如果基础颜色足够，直接返回
    if (count <= baseColors.length) {
        return baseColors.slice(0, count);
    }
    
    // 否则生成随机颜色
    const colors = [...baseColors];
    for (let i = baseColors.length; i < count; i++) {
        const r = Math.floor(Math.random() * 200) + 55;
        const g = Math.floor(Math.random() * 200) + 55;
        const b = Math.floor(Math.random() * 200) + 55;
        colors.push(`rgb(${r}, ${g}, ${b})`);
    }
    
    return colors;
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '无截止日期';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
}

// Format relative time
function formatRelativeTime(dateString) {
    if (!dateString) return '';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return `已逾期 ${Math.abs(diffDays)} 天`;
    } else if (diffDays === 0) {
        return '今天截止';
    } else if (diffDays === 1) {
        return '明天截止';
    } else {
        return `还剩 ${diffDays} 天`;
    }
}

// 显示提示对话框，替代 alert
function showAlert(message, title = '提示') {
    const alertModal = document.getElementById('alert-modal');
    const alertTitle = document.getElementById('alert-modal-title');
    const alertBody = document.getElementById('alert-modal-body');
    
    alertTitle.textContent = title;
    alertBody.textContent = message;
    
    const bsModal = new bootstrap.Modal(alertModal);
    bsModal.show();
    
    return bsModal;
}

// 显示确认对话框，替代 confirm
function showConfirm(message, callback, title = '确认操作') {
    const confirmModal = document.getElementById('confirm-modal');
    const confirmTitle = document.getElementById('confirm-modal-title');
    const confirmBody = document.getElementById('confirm-modal-body');
    const confirmOkBtn = document.getElementById('confirm-ok-btn');
    
    confirmTitle.textContent = title;
    confirmBody.textContent = message;
    
    // 存储回调函数
    currentConfirmCallback = callback;
    
    // 绑定确认按钮点击事件
    confirmOkBtn.onclick = function() {
        if (currentConfirmCallback) {
            currentConfirmCallback(true);
        }
        bootstrap.Modal.getInstance(confirmModal).hide();
    };
    
    // 绑定取消按钮点击事件
    document.getElementById('confirm-cancel-btn').onclick = function() {
        if (currentConfirmCallback) {
            currentConfirmCallback(false);
        }
        bootstrap.Modal.getInstance(confirmModal).hide();
    };
    
    // 绑定对话框关闭事件
    confirmModal.addEventListener('hidden.bs.modal', function() {
        if (currentConfirmCallback) {
            currentConfirmCallback(false);
            currentConfirmCallback = null;
        }
    }, { once: true });
    
    const bsModal = new bootstrap.Modal(confirmModal);
    bsModal.show();
    
    return bsModal;
}

// Handle API errors
function handleApiError(error) {
    console.error('API Error:', error);
    showAlert('操作失败，请重试或检查控制台日志。', '错误');
}

// ======================
// Task Management
// ======================

// Setup Task Event Listeners
function setupTaskEventListeners() {
    // Add task button
    const addTaskBtn = document.getElementById('add-task-btn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', openAddTaskModal);
    }
    
    // Save task button
    const saveTaskBtn = document.getElementById('save-task-btn');
    if (saveTaskBtn) {
        saveTaskBtn.addEventListener('click', saveTask);
    }
    
    // Save progress button
    const saveProgressBtn = document.getElementById('save-progress-btn');
    if (saveProgressBtn) {
        saveProgressBtn.addEventListener('click', saveTaskProgress);
    }
    
    // 设置任务筛选器事件监听
    setupTaskFilterEventListeners();
    
    // 添加客户按钮
    const addClientBtn = document.getElementById('add-client-btn');
    if (addClientBtn) {
        addClientBtn.addEventListener('click', addClient);
    }
    
    // 添加项目类型按钮
    const addCategoryBtn = document.getElementById('add-category-btn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', addCategory);
    }
    
    // 客户名称输入框事件
    const clientInput = document.getElementById('task-client');
    if (clientInput) {
        clientInput.addEventListener('input', function() {
            filterClientOptions(this.value);
        });
    }
    
    // 任务类别输入框事件
    const categoryInput = document.getElementById('task-category');
    if (categoryInput) {
        categoryInput.addEventListener('input', function() {
            filterCategoryOptions(this.value);
        });
    }
}

// Load Tasks Data
function loadTasksData(autoTransferToProjects = false) {
    if (!window.pywebview) {
        console.warn('PyWebView API not available yet');
        return;
    }
    
    window.pywebview.api.get_tasks().then(tasks => {
        console.log('All tasks loaded:', tasks.length);
        
        // 过滤掉已删除的任务和已完成的任务(已完成任务将在项目模块中显示)
        tasksList = tasks.filter(task => {
            const isDeleted = task.is_deleted === true || task.status === 'deleted';
            const isCompleted = task.status === 'completed';
            return !isDeleted && !isCompleted;
        });
        
        // 更新任务状态：有进度记录的任务标记为"进行中"，没有进度记录的任务标记为"待办"
        tasksList.forEach(task => {
            // 已完成的任务不需要处理
            if (task.status === 'completed') {
                return;
            }
            
            // 检查是否有进度记录
            if (window.pywebview) {
                window.pywebview.api.get_task_progress(task.id)
                    .then(progress => {
                        // 如果有进度记录但状态不是"进行中"，更新状态
                        if (progress && progress.length > 0 && task.status !== 'in-progress') {
                            window.pywebview.api.update_task(task.id, {
                                status: 'in-progress'
                            }).then(() => {
                                console.log(`任务 "${task.title}" 状态已更新为进行中`);
                                task.status = 'in-progress';
                                // 更新任务状态徽章
                                updateTaskStatusBadge();
                            }).catch(error => {
                                console.error('更新任务状态失败:', error);
                            });
                        } 
                        // 如果没有进度记录但状态不是"待办"，更新状态
                        else if ((!progress || progress.length === 0) && task.status !== 'pending') {
                            window.pywebview.api.update_task(task.id, {
                                status: 'pending'
                            }).then(() => {
                                console.log(`任务 "${task.title}" 状态已更新为待办`);
                                task.status = 'pending';
                                // 更新任务状态徽章
                                updateTaskStatusBadge();
                            }).catch(error => {
                                console.error('更新任务状态失败:', error);
                            });
                        }
                    })
                    .catch(error => {
                        console.error('获取任务进度失败:', error);
                    });
            }
        });
        
        console.log('Tasks after filtering:', tasksList.length);
        renderTasksList(tasksList);
        updateTaskStatusBadge();
        
        // 加载客户和任务类别选项列表
        loadClientsFromDatabase();
        loadCategoriesFromDatabase();
        
        // 仅当需要时，将已完成的任务转移到项目模块
        if (autoTransferToProjects) {
            const completedTasks = tasks.filter(task => {
                const isDeleted = task.is_deleted === true || task.status === 'deleted';
                return !isDeleted && task.status === 'completed';
            });
            
            if (completedTasks.length > 0) {
                console.log('Completed tasks to add to projects:', completedTasks.length);
                transferCompletedTasksToProjects(completedTasks);
            }
        }
    }).catch(handleApiError);
}

// 将已完成的任务转移到项目模块
function transferCompletedTasksToProjects(completedTasks) {
    // 检查每个已完成的任务是否已经作为项目存在
    // 如果不存在，则创建新项目
    if (!window.pywebview) {
        console.warn('PyWebView API not available, unable to transfer tasks to projects');
        return;
    }
    
    // 首先获取现有项目
    window.pywebview.api.get_projects(true).then(projects => {
        // 创建一个映射表来检查任务是否已经转为项目
        const existingProjects = {};
        projects.forEach(project => {
            if (project.task_id) {
                existingProjects[project.task_id] = project;
            }
        });
        
        // 过滤出尚未转换为项目的任务
        const tasksToConvert = completedTasks.filter(task => !existingProjects[task.id]);
        
        if (tasksToConvert.length === 0) {
            console.log('没有新的已完成任务需要转移到项目');
            return;
        }
        
        console.log(`需要转移到项目的新完成任务: ${tasksToConvert.length}`);
        
        // 处理每个已完成的任务
        const promises = [];
        
        tasksToConvert.forEach(task => {
            // 创建新项目
            const today = new Date().toISOString().split('T')[0];
            
            // 创建项目名称 - 如果有客户名称，添加到项目名称中
            let projectName = task.title;
            if (task.client) {
                projectName = `[${task.client}] ${task.title}`;
            }
            
            // 使用任务类别作为项目类型
            const projectType = task.category || '已完成任务';
            
            // 项目备注中添加任务备注和客户信息
            let projectNotes = task.notes || '';
            if (task.client && !projectName.includes(`[${task.client}]`)) {
                projectNotes = `客户: ${task.client}\n${projectNotes}`;
            }
            
            // 获取任务数量，如果未设置则默认为1
            const quantity = task.quantity || 1;
            
            // 根据API参数要求调整add_project调用
            const promise = window.pywebview.api.add_project(
                projectName,
                projectType,
                quantity,
                today,
                'unpaid',
                projectNotes,
                task.id  // 添加task_id参数
            ).then(() => {
                console.log(`已完成任务 "${task.title}" 已转移到项目模块，数量: ${quantity}`);
            }).catch(error => {
                console.error('转移任务到项目失败:', error);
            });
            
            promises.push(promise);
        });
        
        // 等待所有项目创建完成
        Promise.all(promises).then(() => {
            console.log('所有已完成任务转移完成');
            
            // 如果当前在项目页面，刷新项目列表
            const projectsPage = document.getElementById('projects-page');
            if (projectsPage && projectsPage.classList.contains('active')) {
                loadProjectsData();
            }
        });
    }).catch(error => {
        console.error('获取项目列表失败:', error);
    });
}

// Render Tasks List
function renderTasksList(tasks) {
    const tasksListElement = document.getElementById('tasks-list');
    if (!tasksListElement) return;
    
    tasksListElement.innerHTML = '';
    
    if (tasks.length === 0) {
        tasksListElement.innerHTML = `
            <div class="empty-state">
                <p><i class="bi bi-emoji-laughing"></i> 一起摸鱼吧！</p>
            </div>
        `;
        return;
    }
    
    // 获取当前筛选状态
    const statusFilter = document.getElementById('task-status-filter').value;
    const priorityFilter = document.getElementById('task-priority-filter').value;
    
    // 应用筛选
    let filteredTasks = [...tasks];
    
    if (statusFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
    }
    
    if (priorityFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
    }
    
    // 更新任务状态徽章
    updateTaskStatusBadge();
    
    // 按状态对任务进行分组
    const pendingTasks = filteredTasks.filter(task => task.status === 'pending');
    const inProgressTasks = filteredTasks.filter(task => task.status === 'in-progress');
    
    // 首先按优先级排序
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    const sortTasks = (a, b) => {
        // 1. 按优先级排序
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // 2. 按截止日期排序
        const dateA = a.deadline ? new Date(a.deadline) : new Date(9999, 11, 31);
        const dateB = b.deadline ? new Date(b.deadline) : new Date(9999, 11, 31);
        return dateA - dateB;
    };
    
    pendingTasks.sort(sortTasks);
    inProgressTasks.sort(sortTasks);
    
    // 组合排序后的任务列表
    const sortedTasks = [...inProgressTasks, ...pendingTasks];
    
    // 渲染任务列表
    sortedTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        
        const checkboxClass = task.status === 'completed' ? 'bi bi-check-circle-fill' : 'bi bi-circle';
        const titleClass = task.status === 'completed' ? 'text-decoration-line-through' : '';
        
        // 状态标签
        let statusLabel = '';
        if (task.status === 'pending') {
            statusLabel = '<span class="badge bg-secondary">待办</span>';
        } else if (task.status === 'in-progress') {
            statusLabel = '<span class="badge bg-primary">进行中</span>';
        }
        
        taskElement.innerHTML = `
            <div class="task-checkbox">
                <i class="${checkboxClass}" data-task-id="${task.id}" data-task-status="${task.status}"></i>
            </div>
            <div class="task-content">
                <div class="task-title ${titleClass}">
                    <span class="task-priority ${task.priority}"></span>
                    ${task.title} ${statusLabel}
                </div>
                <div class="task-details">
                    <span class="task-deadline">
                        <i class="bi bi-calendar"></i> ${formatDate(task.deadline)}
                    </span>
                    <span class="task-deadline-relative">
                        ${task.status !== 'completed' ? formatRelativeTime(task.deadline) : ''}
                    </span>
                </div>
                ${task.client ? `<div class="task-client"><i class="bi bi-person"></i> ${task.client}</div>` : ''}
                ${task.category ? `<div class="task-category"><i class="bi bi-tag"></i> ${task.category}</div>` : ''}
                ${task.quantity > 1 ? `<div class="task-quantity"><i class="bi bi-123"></i> 数量: ${task.quantity}</div>` : ''}
            </div>
            <div class="task-actions">
                <button type="button" class="progress-btn" data-task-id="${task.id}" title="修改进度">
                    <i class="bi bi-journal-text"></i>
                </button>
                <button type="button" class="edit-task-btn" data-task-id="${task.id}" title="编辑任务">
                    <i class="bi bi-pencil"></i>
                </button>
                <button type="button" class="delete-task-btn" data-task-id="${task.id}" title="删除任务">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        
        tasksListElement.appendChild(taskElement);
    });
    
    // Add event listeners to the newly created elements
    document.querySelectorAll('.task-checkbox i').forEach(checkbox => {
        checkbox.addEventListener('click', toggleTaskStatus);
    });
    
    document.querySelectorAll('.progress-btn').forEach(btn => {
        btn.addEventListener('click', openTaskProgressModal);
    });
    
    document.querySelectorAll('.edit-task-btn').forEach(btn => {
        btn.addEventListener('click', openEditTaskModal);
    });
    
    document.querySelectorAll('.delete-task-btn').forEach(btn => {
        btn.addEventListener('click', deleteTask);
    });
}

// Filter Tasks
function filterTasks() {
    // 我们不需要在这里过滤任务，因为renderTasksList函数已经处理了筛选逻辑
    // 直接调用renderTasksList重新渲染即可
    renderTasksList(tasksList);
}

// Open Add Task Modal
function openAddTaskModal() {
    const taskForm = document.getElementById('task-form');
    const taskModal = new bootstrap.Modal(document.getElementById('task-modal'));
    
    // Reset form
    taskForm.reset();
    document.getElementById('task-id').value = '';
    document.querySelector('#task-modal .modal-title').textContent = '添加任务';
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('task-deadline').valueAsDate = tomorrow;
    
    // 加载客户和类别数据
    loadClientsFromDatabase();
    loadCategoriesFromDatabase();
    
    // 显示模态框
    taskModal.show();
    
    // 聚焦到标题输入框
    setTimeout(() => {
        document.getElementById('task-title').focus();
    }, 500);
}

// Open Edit Task Modal
function openEditTaskModal(event) {
    const taskId = event.currentTarget.getAttribute('data-task-id');
    const task = tasksList.find(t => t.id === parseInt(taskId));
    
    if (!task) return;
    
    const taskForm = document.getElementById('task-form');
    const taskModal = new bootstrap.Modal(document.getElementById('task-modal'));
    
    // 加载客户和类别数据
    loadClientsFromDatabase();
    loadCategoriesFromDatabase();
    
    // Fill form with task data
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-client').value = task.client || '';
    document.getElementById('task-category').value = task.category || '';
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-notes').value = task.notes || '';
    document.getElementById('task-quantity').value = task.quantity || 1;
    
    if (task.deadline) {
        document.getElementById('task-deadline').value = task.deadline.split(' ')[0];
    }
    
    document.querySelector('#task-modal .modal-title').textContent = '编辑任务';
    
    // 显示模态框
    taskModal.show();
    
    // 聚焦到标题输入框
    setTimeout(() => {
        document.getElementById('task-title').focus();
    }, 500);
}

// 返回加载客户列表的Promise
function loadClientsPromise() {
    return new Promise((resolve, reject) => {
        if (!window.pywebview) {
            console.warn('PyWebView API not available, unable to load clients');
            resolve([]);
            return;
        }
        
        window.pywebview.api.get_projects(true).then(projects => {
            const clientDatalist = document.getElementById('client-options');
            if (!clientDatalist) {
                resolve([]);
                return;
            }
            
            // 清空现有选项
            clientDatalist.innerHTML = '';
            
            // 提取客户名称
            let extractedClients = [];
            
            projects.forEach(project => {
                // 从项目名称提取
                const clientMatch = project.name.match(/\[(.*?)\]/);
                if (clientMatch && clientMatch[1]) {
                    extractedClients.push(clientMatch[1]);
                }
                
                // 从备注中提取
                if (project.notes && project.notes.includes('客户:')) {
                    const notesClientMatch = project.notes.match(/客户:\s*([^\n]+)/);
                    if (notesClientMatch && notesClientMatch[1]) {
                        extractedClients.push(notesClientMatch[1].trim());
                    }
                }
            });
            
            // 去重并排序
            clientsList = [...new Set(extractedClients)].sort();
            
            // 添加到datalist
            clientsList.forEach(client => {
                const option = document.createElement('option');
                option.value = client;
                clientDatalist.appendChild(option);
            });
            
            console.log('客户列表已从项目中加载:', clientsList.length);
            resolve(clientsList);
        }).catch(error => {
            console.error('获取项目列表失败:', error);
            reject(error);
        });
    });
}

// 返回加载类别列表的Promise
function loadCategoriesPromise() {
    return new Promise((resolve, reject) => {
        if (!window.pywebview) {
            console.warn('PyWebView API not available, unable to load categories');
            resolve([]);
            return;
        }
        
        window.pywebview.api.get_projects(true).then(projects => {
            const categoryDatalist = document.getElementById('category-options');
            if (!categoryDatalist) {
                resolve([]);
                return;
            }
            
            // 清空现有选项
            categoryDatalist.innerHTML = '';
            
            // 提取项目类型
            let extractedTypes = [];
            
            projects.forEach(project => {
                // 从项目类型字段提取
                if (project.type && project.type.trim() !== '') {
                    extractedTypes.push(project.type.trim());
                }
            });
            
            // 去重并排序
            categoriesList = [...new Set(extractedTypes)].sort();
            
            // 添加到datalist
            categoriesList.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                categoryDatalist.appendChild(option);
            });
            
            console.log('任务类别列表已从项目中加载:', categoriesList.length);
            resolve(categoriesList);
        }).catch(error => {
            console.error('获取项目列表失败:', error);
            reject(error);
        });
    });
}

// Save Task
function saveTask() {
    const taskId = document.getElementById('task-id').value;
    const title = document.getElementById('task-title').value;
    const client = document.getElementById('task-client').value;
    const category = document.getElementById('task-category').value;
    const deadline = document.getElementById('task-deadline').value;
    const priority = document.getElementById('task-priority').value;
    const notes = document.getElementById('task-notes').value;
    const quantity = parseInt(document.getElementById('task-quantity').value) || 1;
    
    if (!title) {
        showAlert('请输入任务标题', '表单验证');
        return;
    }
    
    if (!window.pywebview) {
        showAlert('系统API未就绪，请稍后重试', '错误');
        return;
    }
    
    if (taskId) {
        // Update existing task
        const params = {
            title: title,
            client: client,
            category: category,
            deadline: deadline,
            priority: priority,
            notes: notes,
            quantity: quantity
        };
        
        window.pywebview.api.update_task(parseInt(taskId), params).then(() => {
            bootstrap.Modal.getInstance(document.getElementById('task-modal')).hide();
            loadTasksData();
            
            // 显示成功提示
            showAlert('任务已成功更新', '成功');
        }).catch(handleApiError);
    } else {
        // Add new task
        window.pywebview.api.add_task(
            title,
            category, // 使用category代替之前的description参数
            deadline,
            priority,
            notes,
            client, // 添加client参数
            quantity // 添加quantity参数
        ).then(() => {
            bootstrap.Modal.getInstance(document.getElementById('task-modal')).hide();
            loadTasksData();
            
            // 显示成功提示
            showAlert('任务已成功添加', '成功');
        }).catch(handleApiError);
    }
}

// Toggle Task Status
function toggleTaskStatus(event) {
    const taskId = event.currentTarget.getAttribute('data-task-id');
    const currentStatus = event.currentTarget.getAttribute('data-task-status');
    
    // 只有未完成的任务才需要确认
    if (currentStatus !== 'completed') {
        showConfirm('确定要将此任务标记为已完成吗？', function(confirmed) {
            if (confirmed) {
                updateTaskStatus(taskId, currentStatus);
            }
        }, '完成任务');
    } else {
        updateTaskStatus(taskId, currentStatus);
    }
}

// 更新任务状态
function updateTaskStatus(taskId, currentStatus) {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    if (!window.pywebview) {
        showAlert('系统API未就绪，请稍后重试', '错误');
        return;
    }
    
    const params = {
        status: newStatus
    };
    
    window.pywebview.api.update_task(parseInt(taskId), params).then(() => {
        console.log(`任务状态已更新为 ${newStatus}`);
        
        // 如果任务标记为已完成，则自动将其转移到项目
        if (newStatus === 'completed') {
            // 查找当前任务
            const task = tasksList.find(t => t.id === parseInt(taskId));
            if (task) {
                console.log('将已完成任务转移到项目:', task.title);
                
                // 更新任务状态
                task.status = 'completed';
                
                // 立即转移此任务到项目
                transferCompletedTasksToProjects([task]);
                
                // 从当前任务列表中移除
                tasksList = tasksList.filter(t => t.id !== parseInt(taskId));
                
                // 更新任务状态徽章
                updateTaskStatusBadge();
                
                // 延迟一会儿再刷新，确保状态更新已经完成
                setTimeout(() => {
                    loadTasksData(false); // 不需要再次转移
                }, 300);
            }
        } else {
            loadTasksData(false); // 不需要转移
        }
    }).catch(handleApiError);
}

// Delete Task
function deleteTask(event) {
    const taskId = event.currentTarget.getAttribute('data-task-id');
    
    if (!window.pywebview) {
        showAlert('系统API未就绪，请稍后重试', '错误');
        return;
    }
    
    showConfirm('确定要删除这个任务吗？此操作不可撤销。', function(confirmed) {
        if (confirmed) {
            console.log('Deleting task with ID:', taskId);
            
            // 先检索任务对象，方便调试
            const taskToDelete = tasksList.find(t => t.id === parseInt(taskId));
            console.log('Task to delete:', taskToDelete);
            
            // 直接使用update_task方法标记任务为已删除
            window.pywebview.api.update_task(parseInt(taskId), {
                status: 'deleted',
                is_deleted: true
            })
            .then(response => {
                console.log('Task deletion response:', response);
                console.log('Task marked as deleted successfully');
                
                // 短暂延迟后刷新列表，确保后端处理完成
                setTimeout(() => {
                    loadTasksData();
                }, 300);
            })
            .catch(error => {
                console.error('Error deleting task:', error);
                handleApiError(error);
            });
        }
    }, '删除任务');
}

// Open Task Progress Modal
function openTaskProgressModal(event) {
    const taskId = event.currentTarget.getAttribute('data-task-id');
    const task = tasksList.find(t => t.id === parseInt(taskId));
    
    if (!task) return;
    
    if (!window.pywebview) {
        alert('系统API未就绪，请稍后重试');
        return;
    }
    
    document.getElementById('progress-task-id').value = taskId;
    document.getElementById('progress-text').value = '';
    
    // Load task progress history
    window.pywebview.api.get_task_progress(parseInt(taskId)).then(progress => {
        renderTaskProgress(progress);
        
        const progressModal = new bootstrap.Modal(document.getElementById('progress-modal'));
        progressModal.show();
    }).catch(handleApiError);
}

// Render Task Progress
function renderTaskProgress(progressList) {
    const progressListElement = document.getElementById('progress-list');
    progressListElement.innerHTML = '';
    
    if (progressList.length === 0) {
        progressListElement.innerHTML = '<p class="text-center">暂无项目进度记录</p>';
        return;
    }
    
    progressList.forEach(progress => {
        const progressElement = document.createElement('div');
        progressElement.className = 'progress-item';
        progressElement.innerHTML = `
            <div class="progress-text">${progress.progress_text}</div>
            <div class="progress-timestamp">${progress.timestamp}</div>
        `;
        progressListElement.appendChild(progressElement);
    });
}

// Save Task Progress
function saveTaskProgress() {
    const taskId = document.getElementById('progress-task-id').value;
    const progressText = document.getElementById('progress-text').value;
    
    if (!progressText) {
        showAlert('请输入进度内容', '表单验证');
        return;
    }
    
    if (!window.pywebview) {
        showAlert('系统API未就绪，请稍后重试', '错误');
        return;
    }
    
    window.pywebview.api.add_task_progress(
        parseInt(taskId),
        progressText
    ).then(() => {
        // 更新任务状态为进行中
        window.pywebview.api.update_task(parseInt(taskId), {
            status: 'in-progress'
        }).then(() => {
            console.log('任务状态已更新为进行中');
            
            // 更新任务列表中的状态
            const task = tasksList.find(t => t.id === parseInt(taskId));
            if (task) {
                task.status = 'in-progress';
                // 更新任务状态徽章
                updateTaskStatusBadge();
            }
            
            // 关闭进度对话框
            bootstrap.Modal.getInstance(document.getElementById('progress-modal')).hide();
            
            // 刷新任务列表，更新状态显示
            loadTasksData();
            
        }).catch(error => {
            console.error('更新任务状态失败:', error);
        });
    }).catch(handleApiError);
}

// ======================
// Account Management
// ======================

// Setup Account Event Listeners
function setupAccountEventListeners() {
    // Add account button
    const addAccountBtn = document.getElementById('add-account-btn');
    if (addAccountBtn) {
        addAccountBtn.addEventListener('click', openAddAccountModal);
    }
    
    // Save account button
    const saveAccountBtn = document.getElementById('save-account-btn');
    if (saveAccountBtn) {
        saveAccountBtn.addEventListener('click', saveAccount);
    }
    
    // Password toggle buttons
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', togglePasswordVisibility);
    });
    
    // 扩展行按钮
    const addRowBtn = document.getElementById('add-row-btn');
    if (addRowBtn) {
        addRowBtn.addEventListener('click', function() {
            const rowFieldContainer = document.getElementById('row-field-container');
            const rowField = document.getElementById('account-row');
            if (rowFieldContainer) {
                // 显示字段并清空其内容
                rowFieldContainer.classList.remove('d-none');
                if (rowField) {
                    rowField.value = ''; // 确保字段为空
                    rowField.focus(); // 聚焦到扩展行字段
                }
                this.classList.add('d-none');
            }
        });
    }
    
    // Account filter
    const tagFilter = document.getElementById('account-tag-filter');
    if (tagFilter) {
        tagFilter.addEventListener('change', filterAccounts);
    }
    
    // 搜索框
    const searchInput = document.getElementById('account-search');
    if (searchInput) {
        searchInput.addEventListener('input', filterAccounts);
    }
    
    // 清除搜索按钮
    const clearSearchBtn = document.getElementById('clear-account-search');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            const searchInput = document.getElementById('account-search');
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
                filterAccounts(); // 触发筛选
            }
        });
    }
    
    // 管理网站类型按钮
    const manageWebsitesBtn = document.getElementById('manage-websites-btn');
    if (manageWebsitesBtn) {
        manageWebsitesBtn.addEventListener('click', openWebsitesModal);
    }
    
    // 添加网站类型按钮
    const addWebsiteBtn = document.getElementById('add-website-btn');
    if (addWebsiteBtn) {
        addWebsiteBtn.addEventListener('click', addWebsite);
    }
    
    // 保存网站类型按钮
    const saveWebsiteBtn = document.getElementById('save-website-btn');
    if (saveWebsiteBtn) {
        saveWebsiteBtn.addEventListener('click', saveWebsite);
    }
}

// Load Accounts Data
function loadAccountsData() {
    if (!window.pywebview) {
        console.warn('PyWebView API not available yet');
        return;
    }
    
    // 加载网站类型列表
    loadWebsitesData();
    
    // 清空搜索框
    const searchInput = document.getElementById('account-search');
    if (searchInput) {
        searchInput.value = '';
    }
    
    window.pywebview.api.get_accounts().then(accounts => {
        console.log("原始账号数据:", accounts);
        
        // 修复数据：检测并修复可能错位的数据
        const fixedAccounts = accounts.map(account => {
            const fixed = {...account};
            
            // 检测账号字段是否包含日期格式，如果是则可能是错位的
            if (fixed.account && 
                (fixed.account.includes('-') || 
                 fixed.account.match(/^\d{4}-\d{2}-\d{2}/))) {
                console.log(`检测到账号字段可能错位: ${fixed.account}`);
                
                // 如果row字段看起来像账号，而account字段看起来像日期，则交换它们
                if (fixed.row && !fixed.row.includes('-') && !fixed.row.match(/^\d{4}-\d{2}-\d{2}/)) {
                    console.log(`修复错位: 交换account和row字段的值`);
                    console.log(`修复前: account=${fixed.account}, row=${fixed.row}`);
                    
                    const temp = fixed.account;
                    fixed.account = fixed.row;
                    fixed.row = temp;
                    
                    console.log(`修复后: account=${fixed.account}, row=${fixed.row}`);
                } else {
                    // 如果row字段不像账号，直接清空account
                    console.log(`无法找到有效的账号值，清空account字段`);
                    fixed.account = '';
                }
            }
            
            // 清理可能的空值或无效值
            if (fixed.row === 'null' || fixed.row === 'undefined' || fixed.row === null) {
                fixed.row = '';
            }
            
            if (fixed.account === 'null' || fixed.account === 'undefined' || fixed.account === null) {
                fixed.account = '';
            }
            
            return fixed;
        });
        
        console.log("修复后的账号数据:", fixedAccounts);
        accountsList = fixedAccounts;
        renderAccountsList(fixedAccounts);
        
        // 更新标签筛选下拉框
        updateTagFilterOptions(fixedAccounts);
    }).catch(handleApiError);
}

// 加载网站类型数据
function loadWebsitesData() {
    if (!window.pywebview) {
        console.warn('PyWebView API not available yet');
        return;
    }
    
    window.pywebview.api.get_websites()
        .then(websites => {
            console.log('网站类型列表已加载:', websites.length);
            // 保存完整的网站对象数组，而不只是名称
            websitesList = websites;
            updateWebsiteDatalist();
        })
        .catch(error => {
            console.error('获取网站类型列表失败:', error);
        });
}

// Render Accounts List
function renderAccountsList(accounts) {
    const accountsListElement = document.getElementById('accounts-list');
    if (!accountsListElement) return;
    
    accountsListElement.innerHTML = '';
    
    if (accounts.length === 0) {
        accountsListElement.innerHTML = `
            <div class="empty-state">
                <p><i class="bi bi-person-circle"></i>暂无账号数据</p>
            </div>
        `;
        return;
    }
    
    // 调试输出账号列表
    console.log("账号列表数据:", accounts);
    
    accounts.forEach(account => {
        // 调试输出，查看账号数据的完整结构
        console.log("渲染账号数据:", account);
        
        // 验证数据字段
        const validAccount = {
            id: account.id,
            website_name: account.website_name || '未知网站',
            username: account.username || '',
            account: (account.account !== undefined && account.account !== null && 
                     !account.account.includes('20') && !account.account.includes('-')) 
                     ? account.account : '',
            row: (account.row !== undefined && account.row !== null && 
                 account.row !== 'null' && account.row !== 'undefined') 
                 ? account.row : '',
            password: account.password || '',
            tag: account.tag || '',
            notes: account.notes || ''
        };
        
        // 输出处理后的数据
        console.log("验证后的账号数据:", validAccount);
        
        // 查找网站URL
        let websiteUrl = '';
        if (Array.isArray(websitesList)) {
            const website = websitesList.find(w => w.name === validAccount.website_name);
            if (website && website.url) {
                websiteUrl = website.url;
            }
        }
        
        const accountElement = document.createElement('div');
        accountElement.className = 'account-item';
        
        // 根据是否有网站URL决定是否添加链接
        const titleContent = websiteUrl ? 
            `<div class="account-title website-link" data-url="${websiteUrl}" title="点击访问网站">
                <i class="bi bi-globe"></i>
                ${validAccount.website_name}
            </div>` :
            `<div class="account-title">
                <i class="bi bi-globe"></i>
                ${validAccount.website_name}
            </div>`;
        
        accountElement.innerHTML = `
            <div class="account-header">
                ${titleContent}
                <div class="account-actions">
                    <button type="button" class="copy-account-btn" data-account-id="${validAccount.id}">
                        <i class="bi bi-clipboard"></i>
                    </button>
                    <button type="button" class="edit-account-btn" data-account-id="${validAccount.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" class="delete-account-btn" data-account-id="${validAccount.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
            <div class="account-details">
                ${validAccount.username ? `
                <div class="account-detail">
                    <strong>用户名:</strong>
                    ${validAccount.username}
                </div>
                ` : ''}
                ${validAccount.account ? `
                <div class="account-detail">
                    <strong>账号:</strong>
                    ${validAccount.account}
                </div>
                ` : ''}
                ${validAccount.row ? `
                <div class="account-detail">
                    <strong>扩展行:</strong>
                    ${validAccount.row}
                </div>
                ` : ''}
                ${validAccount.password ? `
                <div class="account-detail">
                    <strong>密码:</strong>
                    <span class="password-masked">••••••••</span>
                    <button class="btn btn-sm btn-link show-password-btn" data-password="${validAccount.password}">
                        <i class="bi bi-eye-slash"></i>
                    </button>
                </div>
                ` : ''}
                ${validAccount.tag ? `
                <div class="account-detail">
                    <strong>项目类型:</strong>
                    ${validAccount.tag}
                </div>
                ` : ''}
                ${validAccount.notes ? `
                <div class="account-detail">
                    <strong>备注:</strong>
                    ${validAccount.notes}
                </div>
                ` : ''}
            </div>
        `;
        
        accountsListElement.appendChild(accountElement);
    });
    
    // Add event listeners to the newly created elements
    document.querySelectorAll('.copy-account-btn').forEach(btn => {
        btn.addEventListener('click', copyAccountInfo);
    });
    
    document.querySelectorAll('.edit-account-btn').forEach(btn => {
        btn.addEventListener('click', openEditAccountModal);
    });
    
    document.querySelectorAll('.delete-account-btn').forEach(btn => {
        btn.addEventListener('click', deleteAccount);
    });
    
    document.querySelectorAll('.show-password-btn').forEach(btn => {
        btn.addEventListener('click', togglePasswordDisplay);
    });
    
    // 添加网站链接点击事件
    document.querySelectorAll('.website-link').forEach(link => {
        link.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            if (url) {
                // 使用window.open打开网站
                window.open(url, '_blank');
            }
        });
        
        // 添加鼠标样式，让用户知道可以点击
        link.style.cursor = 'pointer';
        link.style.textDecoration = 'underline';
    });
}

// Filter Accounts
function filterAccounts() {
    // 获取选中的标签值
    const tagFilter = document.getElementById('account-tag-filter');
    const selectedTag = tagFilter ? tagFilter.value : 'all';
    
    // 获取搜索框的值
    const searchInput = document.getElementById('account-search');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    // 筛选账号
    let filteredAccounts = [...accountsList];
    
    // 按项目类型筛选
    if (selectedTag !== 'all') {
        filteredAccounts = filteredAccounts.filter(account => {
            if (!account.tag) return false;
            
            // 支持逗号分隔的多标签
            const accountTags = account.tag.split(',').map(tag => tag.trim());
            return accountTags.includes(selectedTag);
        });
    }
    
    // 按客户名称搜索
    if (searchTerm) {
        filteredAccounts = filteredAccounts.filter(account => {
            // 主要匹配用户名字段（客户名称）
            const username = (account.username || '').toLowerCase();
            return username.includes(searchTerm);
        });
    }
    
    // 渲染筛选后的账号列表
    renderAccountsList(filteredAccounts);
    
    // 显示筛选结果数量
    console.log(`筛选结果: ${filteredAccounts.length}/${accountsList.length} 个账号`);
}

// Open Add Account Modal
function openAddAccountModal() {
    // 加载网站类型数据
    loadWebsitesData();
    
    const accountForm = document.getElementById('account-form');
    const accountModal = new bootstrap.Modal(document.getElementById('account-modal'));
    
    // Reset form
    accountForm.reset();
    document.getElementById('account-id').value = '';
    document.querySelector('#account-modal .modal-title').textContent = '添加账号';
    
    // 重置扩展行按钮状态
    const rowFieldContainer = document.getElementById('row-field-container');
    const addRowBtn = document.getElementById('add-row-btn');
    if (rowFieldContainer && addRowBtn) {
        rowFieldContainer.classList.add('d-none');
        addRowBtn.classList.remove('d-none');
    }
    
    // 加载客户列表到用户名建议
    updateAccountClientOptions();
    
    // 加载项目类型列表到项目类型建议
    updateAccountCategoryOptions();
    
    accountModal.show();
}

// 更新账号表单中的项目类型选项
function updateAccountCategoryOptions() {
    const categoryDatalist = document.getElementById('category-options-account');
    if (categoryDatalist) {
        // 清空现有选项
        categoryDatalist.innerHTML = '';
        
        // 添加项目类型选项
        categoriesList.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            categoryDatalist.appendChild(option);
        });
    }
}

// 更新账号表单中的客户选项
function updateAccountClientOptions() {
    const clientDatalist = document.getElementById('client-options-account');
    if (clientDatalist) {
        // 清空现有选项
        clientDatalist.innerHTML = '';
        
        // 添加客户选项
        clientsList.forEach(client => {
            const option = document.createElement('option');
            option.value = client;
            clientDatalist.appendChild(option);
        });
    }
}

// Open Edit Account Modal
function openEditAccountModal(event) {
    const accountId = event.currentTarget.getAttribute('data-account-id');
    const account = accountsList.find(a => a.id === parseInt(accountId));
    
    if (!account) return;
    
    // 调试输出，详细记录账号数据
    console.log("编辑账号原始数据:", account);
    
    // 验证数据字段，避免错位
    const validAccount = {
        id: account.id,
        website_name: account.website_name || '',
        username: account.username || '',
        account: (account.account !== undefined && account.account !== null && 
                 !account.account.includes('20') && !account.account.includes('-')) 
                 ? account.account : '',
        row: (account.row !== undefined && account.row !== null && 
             account.row !== 'null' && account.row !== 'undefined') 
             ? account.row : '',
        password: account.password || '',
        tag: account.tag || '',
        notes: account.notes || ''
    };
    
    // 加载网站类型数据
    loadWebsitesData();
    
    // 加载客户列表到用户名建议
    updateAccountClientOptions();
    
    // 加载项目类型列表到项目类型建议
    updateAccountCategoryOptions();
    
    const accountForm = document.getElementById('account-form');
    const accountModal = new bootstrap.Modal(document.getElementById('account-modal'));
    
    // 填充表单数据
    document.getElementById('account-id').value = validAccount.id;
    document.getElementById('website-type').value = validAccount.website_name;
    document.getElementById('account-username').value = validAccount.username;
    document.getElementById('account-account').value = validAccount.account;
    document.getElementById('account-password').value = validAccount.password;
    document.getElementById('account-tag').value = validAccount.tag;
    document.getElementById('account-notes').value = validAccount.notes;
    
    // 设置"扩展行"字段状态
    const rowFieldContainer = document.getElementById('row-field-container');
    const rowField = document.getElementById('account-row');
    const addRowBtn = document.getElementById('add-row-btn');
    
    if (validAccount.row) {
        // 如果有row值，显示该字段并填充值
        if (rowFieldContainer) rowFieldContainer.classList.remove('d-none');
        if (rowField) rowField.value = validAccount.row;
        if (addRowBtn) addRowBtn.classList.add('d-none');
    } else {
        // 如果没有row值，隐藏该字段
        if (rowFieldContainer) rowFieldContainer.classList.add('d-none');
        if (addRowBtn) addRowBtn.classList.remove('d-none');
    }
    
    // 更新模态框标题
    document.querySelector('#account-modal .modal-title').textContent = '编辑账号';
    
    // 显示模态框
    accountModal.show();
}

// Save Account
function saveAccount() {
    const accountId = document.getElementById('account-id').value;
    const websiteType = document.getElementById('website-type').value;
    const username = document.getElementById('account-username').value;
    const account = document.getElementById('account-account').value;
    
    // 只有当"扩展行"字段可见时才获取其值，否则设为null
    const rowFieldContainer = document.getElementById('row-field-container');
    const rowField = document.getElementById('account-row');
    let row = null;
    
    if (rowFieldContainer && !rowFieldContainer.classList.contains('d-none') && 
        rowField && rowField.value && rowField.value.trim() !== '') {
        row = rowField.value.trim();
    }
    
    const password = document.getElementById('account-password').value;
    const tag = document.getElementById('account-tag').value;
    const notes = document.getElementById('account-notes').value;
    
    if (!websiteType) {
        showAlert('请输入网站类型', '表单验证');
        return;
    }
    
    if (!window.pywebview) {
        showAlert('系统API未就绪，请稍后重试', '错误');
        return;
    }
    
    if (accountId) {
        // Update existing account
        const params = {
            website_name: websiteType,
            username: username,
            account: account,
            row: row,
            password: password,
            tag: tag,
            notes: notes,
            url: '' // 保持url字段为空字符串而不是null，防止错误
        };
        
        console.log("更新账号参数:", params);
        
        window.pywebview.api.update_account(parseInt(accountId), params)
            .then((result) => {
                console.log("更新账号结果:", result);
                
                if (result && result.success) {
                    bootstrap.Modal.getInstance(document.getElementById('account-modal')).hide();
                    showAlert('账号信息已成功更新', '成功');
                    loadAccountsData();
                } else {
                    showAlert('更新账号失败: ' + JSON.stringify(result), '错误');
                }
            })
            .catch((error) => {
                console.error("更新账号错误:", error);
                handleApiError(error);
            });
    } else {
        // Add new account
        // 确保参数顺序与后端API一致：(website_name, url, username, password, notes, tag, account, row)
        const params = {
            website_name: websiteType,
            url: '',
            username: username,
            password: password,
            notes: notes,
            tag: tag,
            account: account,
            row: row
        };
        
        console.log("添加账号参数:", params);
        
        window.pywebview.api.add_account(
            websiteType,      // website_name
            '',               // url字段保留为空
            username,         // username
            password,         // password
            notes,            // notes
            tag,              // tag
            account,          // account
            row               // row
        ).then((result) => {
            console.log("添加账号结果:", result);
            
            if (result && result.id) {
                bootstrap.Modal.getInstance(document.getElementById('account-modal')).hide();
                showAlert('账号信息已成功添加', '成功');
                loadAccountsData();
            } else {
                showAlert('添加账号失败: ' + JSON.stringify(result), '错误');
            }
        }).catch((error) => {
            console.error("添加账号错误:", error);
            handleApiError(error);
        });
    }
}

// Toggle Password Visibility
function togglePasswordVisibility(event) {
    const passwordField = event.currentTarget.previousElementSibling;
    const icon = event.currentTarget.querySelector('i');
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        icon.className = 'bi bi-eye-slash';
    } else {
        passwordField.type = 'password';
        icon.className = 'bi bi-eye';
    }
}

// Toggle Password Display
function togglePasswordDisplay(event) {
    const passwordSpan = event.currentTarget.previousElementSibling;
    const icon = event.currentTarget.querySelector('i');
    const password = event.currentTarget.getAttribute('data-password');
    
    if (passwordSpan.classList.contains('password-masked')) {
        passwordSpan.textContent = password;
        passwordSpan.classList.remove('password-masked');
        icon.className = 'bi bi-eye';
    } else {
        passwordSpan.textContent = '••••••••';
        passwordSpan.classList.add('password-masked');
        icon.className = 'bi bi-eye-slash';
    }
}

// Copy Account Info
function copyAccountInfo(event) {
    const accountId = event.currentTarget.getAttribute('data-account-id');
    const account = accountsList.find(a => a.id === parseInt(accountId));
    
    if (!account) return;
    
    console.log("复制账号原始数据:", account);
    
    // 验证数据字段，避免错位
    const validAccount = {
        id: account.id,
        website_name: account.website_name || '未知网站',
        username: account.username || '',
        account: (account.account !== undefined && account.account !== null && 
                 !account.account.includes('20') && !account.account.includes('-')) 
                 ? account.account : '',
        row: (account.row !== undefined && account.row !== null && 
             account.row !== 'null' && account.row !== 'undefined') 
             ? account.row : '',
        password: account.password || '',
        tag: account.tag || '',
        notes: account.notes || ''
    };
    
    console.log("复制账号验证后数据:", validAccount);
    
    let infoText = `网站类型: ${validAccount.website_name}\n`;
    if (validAccount.username) infoText += `用户名: ${validAccount.username}\n`;
    if (validAccount.account) infoText += `账号: ${validAccount.account}\n`;
    if (validAccount.row) infoText += `扩展行: ${validAccount.row}\n`;
    if (validAccount.password) infoText += `密码: ${validAccount.password}\n`;
    if (validAccount.tag) infoText += `项目类型: ${validAccount.tag}\n`;
    
    navigator.clipboard.writeText(infoText).then(() => {
        showAlert('账号信息已复制到剪贴板', '成功');
    }).catch(err => {
        console.error('复制失败:', err);
        showAlert('复制失败，请手动复制', '错误');
    });
}

// Delete Account
function deleteAccount(event) {
    const accountId = event.currentTarget.getAttribute('data-account-id');
    
    if (!window.pywebview) {
        showAlert('系统API未就绪，请稍后重试', '错误');
        return;
    }
    
    showConfirm('确定要删除这个账号信息吗？', function(confirmed) {
        if (confirmed) {
            window.pywebview.api.delete_account(parseInt(accountId)).then(() => {
                loadAccountsData();
            }).catch(handleApiError);
        }
    }, '删除账号');
}

// 更新标签筛选选项
function updateTagFilterOptions(accounts) {
    const tagFilter = document.getElementById('account-tag-filter');
    if (!tagFilter) return;
    
    // 保存当前选中的值
    const currentValue = tagFilter.value;
    
    // 清空选项（保留"全部"选项）
    tagFilter.innerHTML = '<option value="all">所有类型</option>';
    
    // 提取所有不同的标签
    const tagsSet = new Set();
    accounts.forEach(account => {
        if (account.tag) {
            // 支持逗号分隔的多标签
            const tags = account.tag.split(',');
            tags.forEach(tag => {
                const trimmedTag = tag.trim();
                if (trimmedTag) {
                    tagsSet.add(trimmedTag);
                }
            });
        }
    });
    
    // 将标签按字母顺序排序
    const sortedTags = Array.from(tagsSet).sort();
    
    // 添加标签选项
    sortedTags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
    });
    
    // 恢复之前选中的值（如果存在）
    if (sortedTags.includes(currentValue)) {
        tagFilter.value = currentValue;
    }
}

// ======================
// Project Management
// ======================

// Global variable to track archive state
let showArchived = false;

// Setup Project Event Listeners
function setupProjectEventListeners() {
    // Project event listeners
    document.getElementById('add-project-btn')?.addEventListener('click', openAddProjectModal);
    document.getElementById('save-project-btn')?.addEventListener('click', saveProject);
    document.getElementById('toggle-archived')?.addEventListener('click', toggleArchivedProjects);
    document.getElementById('confirm-settlement-btn')?.addEventListener('click', settleProject);
    
    // 项目名称输入框事件
    const projectNameInput = document.getElementById('project-name');
    if (projectNameInput) {
        projectNameInput.addEventListener('input', function() {
            updateProjectClientPrefix(this.value);
        });
    }
    
    // 搜索和筛选事件监听
    document.getElementById('project-search')?.addEventListener('input', function() {
        renderProjectsList(projectsList);
    });
    
    document.getElementById('clear-project-search')?.addEventListener('click', function() {
        document.getElementById('project-search').value = '';
        renderProjectsList(projectsList);
    });
    
    document.getElementById('project-type-filter')?.addEventListener('change', function() {
        renderProjectsList(projectsList);
    });
    
    document.getElementById('project-year-filter')?.addEventListener('change', function() {
        renderProjectsList(projectsList);
    });
    
    // 根据2022年到当前年份填充年份筛选器
    const yearFilter = document.getElementById('project-year-filter');
    if (yearFilter) {
        const currentYear = new Date().getFullYear();
        const startYear = 2022; // 从2022年开始
        
        // 清空现有选项，但保留"全部年份"选项
        while (yearFilter.options.length > 1) {
            yearFilter.remove(1);
        }
        
        // 添加年份选项（从当前年份到2022年）
        for (let year = currentYear; year >= startYear; year--) {
            const option = document.createElement('option');
            option.value = year.toString();
            option.textContent = year.toString() + '年';
            yearFilter.appendChild(option);
        }
        
        console.log("项目模块年份筛选器已更新为2022-" + currentYear);
    }
}

// 更新项目客户前缀显示
function updateProjectClientPrefix(projectName) {
    const clientPrefix = document.getElementById('project-client-prefix');
    if (!clientPrefix) return;
    
    // 尝试从项目名称中提取客户名称
    const clientMatch = projectName.match(/\[(.*?)\]/);
    if (clientMatch && clientMatch[1]) {
        // 有客户名称，显示实际客户
        clientPrefix.textContent = `[${clientMatch[1]}]`;
        clientPrefix.style.display = 'block';
    } else if (projectName.startsWith('[') && !projectName.includes(']')) {
        // 正在输入客户名称
        clientPrefix.textContent = '';
        clientPrefix.style.display = 'none';
    } else {
        // 没有客户名称，显示提示
        clientPrefix.textContent = '[客户]';
        clientPrefix.style.display = 'block';
    }
}

// Load Projects Data
function loadProjectsData() {
    if (!window.pywebview) {
        console.warn('PyWebView API not available yet');
        return;
    }
    
    window.pywebview.api.get_projects(showArchived).then(projects => {
        projectsList = projects;
        renderProjectsList(projects);
        
        // 加载项目类型选项
        loadProjectTypeOptions(projects);
    }).catch(handleApiError);
}

// 加载项目类型选项
function loadProjectTypeOptions(projects) {
    const typeDatalist = document.getElementById('project-type-options');
    if (!typeDatalist) return;
    
    // 清空现有选项
    typeDatalist.innerHTML = '';
    
    // 提取项目类型
    let projectTypes = [...new Set(projects.filter(project => project.type).map(project => project.type))];
    
    // 添加到datalist
    projectTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        typeDatalist.appendChild(option);
    });
    
    // 更新筛选下拉框
    const typeFilter = document.getElementById('project-type-filter');
    if (typeFilter) {
        // 保存当前选中的值
        const currentValue = typeFilter.value;
        
        // 清除现有选项，但保留"全部类型"选项
        while (typeFilter.options.length > 1) {
            typeFilter.remove(1);
        }
        
        // 添加项目类型选项
        projectTypes.sort().forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeFilter.appendChild(option);
        });
        
        // 恢复之前选中的值（如果仍然可用）
        if (currentValue && currentValue !== 'all' && projectTypes.includes(currentValue)) {
            typeFilter.value = currentValue;
        }
    }
    
    console.log('项目类型选项已更新:', projectTypes.length);
}

// Render Projects List
function renderProjectsList(projects) {
    const projectsListElement = document.getElementById('projects-list');
    if (!projectsListElement) return;
    
    projectsListElement.innerHTML = '';
    
    if (projects.length === 0) {
        projectsListElement.innerHTML = `
            <div class="empty-state">
                <p><i class="bi bi-emoji-wink"></i>值得表扬，摸鱼先锋！</p>
            </div>
        `;
        return;
    }
    
    // 筛选项目
    let filteredProjects = [...projects];
    
    // 应用搜索筛选
    const searchTerm = document.getElementById('project-search')?.value?.toLowerCase().trim();
    if (searchTerm) {
        filteredProjects = filteredProjects.filter(project => {
            // 搜索项目名称和客户名称
            const clientMatch = project.name.match(/\[(.*?)\]/);
            const clientName = clientMatch ? clientMatch[1].toLowerCase() : '';
            const projectName = project.name.toLowerCase();
            
            return projectName.includes(searchTerm) || clientName.includes(searchTerm);
        });
    }
    
    // 应用类型筛选
    const typeFilter = document.getElementById('project-type-filter')?.value;
    if (typeFilter && typeFilter !== 'all') {
        filteredProjects = filteredProjects.filter(project => project.type === typeFilter);
    }
    
    // 应用年份筛选
    const yearFilter = document.getElementById('project-year-filter')?.value;
    if (yearFilter && yearFilter !== 'all') {
        filteredProjects = filteredProjects.filter(project => {
            if (!project.completion_date) return false;
            const projectYear = project.completion_date.split('-')[0];
            return projectYear === yearFilter;
        });
    }
    
    if (filteredProjects.length === 0) {
        projectsListElement.innerHTML = `
            <div class="empty-state">
                <p>没有符合筛选条件的项目</p>
                <button class="btn btn-outline-secondary" id="clear-project-filters">
                    <i class="bi bi-x-circle"></i> 清除筛选
                </button>
            </div>
        `;
        
        document.getElementById('clear-project-filters')?.addEventListener('click', () => {
            // 清除搜索和筛选
            if (document.getElementById('project-search')) {
                document.getElementById('project-search').value = '';
            }
            if (document.getElementById('project-type-filter')) {
                document.getElementById('project-type-filter').value = 'all';
            }
            if (document.getElementById('project-year-filter')) {
                document.getElementById('project-year-filter').value = 'all';
            }
            loadProjectsData();
        });
        
        return;
    }
    
    filteredProjects.forEach(project => {
        const projectElement = document.createElement('div');
        projectElement.className = 'project-item';
        projectElement.setAttribute('data-project-id', project.id);
        
        // 如果是从任务转移的项目，添加标识
        if (project.task_id) {
            projectElement.classList.add('from-task');
        }
        
        // 提取客户名称
        let clientName = '';
        const clientMatch = project.name.match(/\[(.*?)\]/);
        if (clientMatch && clientMatch[1]) {
            clientName = clientMatch[1];
        }
        
        // 格式化项目名称 - 如果有[客户名称]格式，将其高亮显示
        let formattedName = project.name;
        if (clientName) {
            formattedName = project.name.replace(`[${clientName}]`, `<span class="client-badge">${clientName}</span>`);
        }
        
        projectElement.innerHTML = `
            <div class="project-header">
                <div class="project-title">
                    ${formattedName}
                    ${project.task_id ? '<span class="task-source-badge" title="此项目由已完成任务创建"><i class="bi bi-check-circle-fill"></i></span>' : ''}
                </div>
                <div class="project-actions">
                    ${project.payment_status !== 'paid' ? `
                    <button type="button" class="settle-project-btn btn btn-outline-success btn-sm" data-project-id="${project.id}" title="结算项目">
                        <i class="bi bi-cash-coin"></i>
                    </button>
                    ` : ''}
                    <button type="button" class="edit-project-btn" data-project-id="${project.id}" title="编辑项目">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" class="archive-project-btn" data-project-id="${project.id}" data-archived="${project.archived || 0}" title="${project.archived ? '取消归档' : '归档项目'}">
                        <i class="bi bi-archive${project.archived ? '-fill' : ''}"></i>
                    </button>
                    <button type="button" class="delete-project-btn" data-project-id="${project.id}" title="删除项目">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
            <div class="project-details">
                ${project.type ? `
                <div class="project-detail">
                    <i class="bi bi-tag"></i> <span class="category-badge">${project.type}</span>
                </div>
                ` : ''}
                ${project.quantity ? `
                <div class="project-detail">
                    <i class="bi bi-123"></i> 数量: ${project.quantity}
                </div>
                ` : ''}
                ${project.completion_date ? `
                <div class="project-detail">
                    <i class="bi bi-calendar-check"></i> ${formatDate(project.completion_date)}
                </div>
                ` : ''}
                <div class="project-detail">
                    <span class="payment-status ${project.payment_status || 'unpaid'}">
                        ${project.payment_status === 'paid' ? '已结算' : '未结算'}
                    </span>
                </div>
            </div>
            ${project.notes ? `
            <div class="project-notes mt-2">
                <small>${project.notes.replace(/\n/g, '<br>')}</small>
            </div>
            ` : ''}
        `;
        
        projectsListElement.appendChild(projectElement);
    });
    
    // Add event listeners to the newly created elements
    document.querySelectorAll('.edit-project-btn').forEach(btn => {
        btn.addEventListener('click', openEditProjectModal);
    });
    
    document.querySelectorAll('.archive-project-btn').forEach(btn => {
        btn.addEventListener('click', toggleProjectArchive);
    });
    
    document.querySelectorAll('.settle-project-btn').forEach(btn => {
        btn.addEventListener('click', openSettleProjectModal);
    });
    
    document.querySelectorAll('.delete-project-btn').forEach(btn => {
        btn.addEventListener('click', deleteProject);
    });
}

// Toggle Archived Projects
function toggleArchivedProjects() {
    showArchived = !showArchived;
    
    const toggleArchivedBtn = document.getElementById('toggle-archived');
    if (toggleArchivedBtn) {
        toggleArchivedBtn.innerHTML = showArchived ? 
            '<i class="bi bi-eye-slash"></i> 隐藏归档' : 
            '<i class="bi bi-archive"></i> 显示归档';
    }
    
    loadProjectsData();
}

// Open Add Project Modal
function openAddProjectModal() {
    const projectForm = document.getElementById('project-form');
    const projectModal = new bootstrap.Modal(document.getElementById('project-modal'));
    
    // Reset form
    projectForm.reset();
    document.getElementById('project-id').value = '';
    document.querySelector('#project-modal .modal-title').textContent = '添加项目';
    
    // 重置客户前缀
    const clientPrefix = document.getElementById('project-client-prefix');
    if (clientPrefix) {
        clientPrefix.textContent = '[客户]';
    }
    
    // Set default date to today
    document.getElementById('completion-date').valueAsDate = new Date();
    
    projectModal.show();
}

// Open Edit Project Modal
function openEditProjectModal(event) {
    const projectId = event.currentTarget.getAttribute('data-project-id');
    const project = projectsList.find(p => p.id === parseInt(projectId));
    
    if (!project) return;
    
    const projectForm = document.getElementById('project-form');
    const projectModal = new bootstrap.Modal(document.getElementById('project-modal'));
    
    // Fill form with project data
    document.getElementById('project-id').value = project.id;
    document.getElementById('project-name').value = project.name;
    document.getElementById('project-type').value = project.type || '';
    document.getElementById('project-quantity').value = project.quantity || '';
    document.getElementById('payment-status').value = project.payment_status || 'unpaid';
    document.getElementById('project-notes').value = project.notes || '';
    
    if (project.completion_date) {
        document.getElementById('completion-date').value = project.completion_date.split(' ')[0];
    }
    
    // 更新客户前缀显示
    updateProjectClientPrefix(project.name);
    
    document.querySelector('#project-modal .modal-title').textContent = '编辑项目';
    
    projectModal.show();
}

// Save Project
function saveProject() {
    const projectId = document.getElementById('project-id').value;
    const name = document.getElementById('project-name').value;
    const type = document.getElementById('project-type').value;
    const quantity = document.getElementById('project-quantity').value;
    const completionDate = document.getElementById('completion-date').value;
    const paymentStatus = document.getElementById('payment-status').value;
    const notes = document.getElementById('project-notes').value;
    
    if (!name) {
        showAlert('请输入项目名称', '表单验证');
        return;
    }
    
    if (projectId) {
        // Update existing project
        const params = {
            name: name,
            type: type,
            quantity: quantity ? parseInt(quantity) : null,
            completion_date: completionDate,
            payment_status: paymentStatus,
            notes: notes
        };
        
        if (window.pywebview) {
            window.pywebview.api.update_project(parseInt(projectId), params).then(() => {
                bootstrap.Modal.getInstance(document.getElementById('project-modal')).hide();
                loadProjectsData();
            }).catch(handleApiError);
        } else {
            console.warn('PyWebView API not available, project update failed');
            showAlert('API未就绪，无法更新项目', '错误');
        }
    } else {
        // Add new project
        if (window.pywebview) {
            window.pywebview.api.add_project(
                name,
                type,
                quantity ? parseInt(quantity) : null,
                completionDate,
                paymentStatus,
                notes
            ).then(() => {
                bootstrap.Modal.getInstance(document.getElementById('project-modal')).hide();
                loadProjectsData();
            }).catch(handleApiError);
        } else {
            console.warn('PyWebView API not available, project addition failed');
            showAlert('API未就绪，无法添加项目', '错误');
        }
    }
}

// Toggle Project Archive
function toggleProjectArchive(event) {
    const projectId = event.currentTarget.getAttribute('data-project-id');
    const isArchived = event.currentTarget.getAttribute('data-archived') === '1';
    
    showConfirm(
        isArchived ? '确定要取消归档此项目吗？' : '确定要归档此项目吗？', 
        function(confirmed) {
            if (confirmed) {
                const params = {
                    archived: isArchived ? 0 : 1
                };
                
                if (window.pywebview) {
                    window.pywebview.api.update_project(parseInt(projectId), params).then(() => {
                        loadProjectsData();
                    }).catch(handleApiError);
                } else {
                    console.warn('PyWebView API not available, project archive toggle failed');
                    showAlert('API未就绪，无法更新项目', '错误');
                }
            }
        },
        isArchived ? '取消归档' : '归档项目'
    );
}

// Delete Project
function deleteProject(event) {
    const projectId = event.currentTarget.getAttribute('data-project-id');
    console.log('尝试删除项目:', projectId);
    
    showConfirm(
        '确定要删除此项目吗？此操作不可恢复！', 
        function(confirmed) {
            if (confirmed && window.pywebview) {
                console.log('用户确认删除项目:', projectId);
                window.pywebview.api.delete_project(parseInt(projectId))
                    .then(result => {
                        console.log('删除项目API返回结果:', result);
                        if (result.success) {
                            // 删除成功，刷新项目列表
                            loadProjectsData();
                            
                            // 如果在报告页面，也需要刷新报告
                            if (document.getElementById('reports-page').classList.contains('active')) {
                                const activePeriod = document.querySelector('.period-selector button.active');
                                if (activePeriod) {
                                    const period = activePeriod.getAttribute('data-period');
                                    setupTaskReportCharts(period);
                                }
                            }
                            
                            showAlert('项目已成功删除', '操作成功');
                        } else {
                            // 如果项目已结算，需要先删除关联的结算记录
                            if (result.error && result.error.includes('请先删除关联的结算记录')) {
                                showAlert('此项目已结算，请先在结算清单中删除相关结算记录，然后再尝试删除此项目', '无法删除');
                            } else {
                                showAlert(result.error || '删除项目失败', '错误');
                            }
                        }
                    })
                    .catch(error => {
                        console.error('调用删除项目API时发生错误:', error);
                        showAlert('删除项目时发生错误: ' + error.message, '错误');
                    });
            } else if (!window.pywebview) {
                console.warn('PyWebView API not available, project deletion failed');
                showAlert('API未就绪，无法删除项目', '错误');
            }
        },
        '删除项目'
    );
}

// Open Add Payment Modal
function openAddPaymentModal() {
    // 确保项目数据已加载
    if (!projectsList || projectsList.length === 0) {
        // 先加载项目数据
        window.pywebview.api.get_projects(true).then(projects => {
            projectsList = projects;
            showAddPaymentModal();
        }).catch(error => {
            console.error('加载项目数据失败:', error);
            showAlert('无法加载项目数据，请刷新页面后重试', '错误');
        });
    } else {
        showAddPaymentModal();
    }
}

// 显示添加结算模态框
function showAddPaymentModal() {
    const paymentForm = document.getElementById('payment-form');
    const paymentModal = new bootstrap.Modal(document.getElementById('payment-modal'));
    
    // 重置表单
    paymentForm.reset();
    document.getElementById('payment-id').value = '';
    
    // 设置默认日期为今天
    document.getElementById('payment-date').valueAsDate = new Date();
    
    // 设置模态框标题
    document.querySelector('#payment-modal .modal-title').textContent = '添加结算';
    
    // 恢复项目选择下拉框
    const projectSelectContainer = document.getElementById('payment-project-container');
    if (projectSelectContainer) {
        projectSelectContainer.innerHTML = `
            <div class="mb-3">
                <label for="payment-project" class="form-label">关联项目 <span class="text-danger">*</span></label>
                <select class="form-select" id="payment-project" required>
                    <option value="" selected disabled>选择项目</option>
                </select>
            </div>
        `;
    }
    
    // 填充项目下拉列表
    populateProjectsDropdown();
    
    // 显示模态框
    paymentModal.show();
    
    // 聚焦到项目选择框
    setTimeout(() => {
        document.getElementById('payment-project').focus();
    }, 500);
}

// 填充项目下拉列表
function populateProjectsDropdown() {
    const projectSelect = document.getElementById('payment-project');
    if (!projectSelect) return;
    
    // 清空现有选项，但保留第一个"选择项目"选项
    while (projectSelect.options.length > 1) {
        projectSelect.remove(1);
    }
    
    // 筛选未结算的项目
    const unpaidProjects = projectsList.filter(project => project.payment_status !== 'paid');
    
    if (unpaidProjects.length === 0) {
        // 如果没有未结算的项目，显示提示
        const option = document.createElement('option');
        option.disabled = true;
        option.text = '无未结算项目';
        projectSelect.add(option);
        return;
    }
    
    // 添加未结算项目到下拉列表
    unpaidProjects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.text = project.name;
        projectSelect.add(option);
    });
}

// Save Payment
function savePayment() {
    const paymentId = document.getElementById('payment-id').value;
    const projectId = document.getElementById('payment-project').value;
    const amount = document.getElementById('payment-amount').value;
    const date = document.getElementById('payment-date').value;
    const notes = document.getElementById('payment-notes').value;
    
    // 验证输入
    if (!paymentId && !projectId) {
        // 只在添加新支付时验证项目ID
        showAlert('请选择关联项目', '表单验证');
        return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
        showAlert('请输入有效的结算金额', '表单验证');
        return;
    }
    
    if (!window.pywebview) {
        showAlert('系统API未就绪，请稍后重试', '错误');
        return;
    }
    
    // 如果是编辑已有结算记录
    if (paymentId) {
        window.pywebview.api.update_payment(parseInt(paymentId), {
            project_id: parseInt(projectId),
            amount: parseFloat(amount),
            date: date,
            notes: notes
        }).then(result => {
            if (result && result.success) {
                // 隐藏模态框
                bootstrap.Modal.getInstance(document.getElementById('payment-modal')).hide();
                
                // 刷新结算列表
                loadPaymentsData();
                
                // 显示成功提示
                showAlert('结算记录已成功更新', '成功');
            } else {
                showAlert(result?.error || '更新结算记录失败', '错误');
            }
        }).catch(handleApiError);
    } else {
        // 添加新结算记录
        window.pywebview.api.add_payment(
            parseInt(projectId),
            parseFloat(amount),
            date,
            notes
        ).then(result => {
            if (result) {
                // 隐藏模态框
                bootstrap.Modal.getInstance(document.getElementById('payment-modal')).hide();
                
                // 刷新结算列表
                loadPaymentsData();
                
                // 可能需要刷新项目列表，因为添加结算会改变项目的结算状态
                if (document.getElementById('projects-page').classList.contains('active')) {
                    loadProjectsData();
                }
                
                // 显示成功提示
                showAlert('结算记录已成功添加', '成功');
            } else {
                showAlert('添加结算记录失败', '错误');
            }
        }).catch(handleApiError);
    }
}

// Load Payments Data
function loadPaymentsData() {
    console.log('加载结算数据...');
    
    if (!checkApiAvailable()) {
        console.error('API未就绪，无法加载结算数据');
        showAlert('系统API未就绪，请稍后重试', '错误');
        return Promise.reject(new Error('API未就绪'));
    }
    
    // 显示加载指示器
    const paymentsPage = document.getElementById('payments-page');
    if (paymentsPage) {
        paymentsPage.classList.add('loading');
    }
    
    // 清空现有数据，防止重复
    paymentsList = [];
    
    const currentYear = new Date().getFullYear().toString();
    const periodFilter = document.getElementById('payment-period-filter')?.value || currentYear;
    
    // 使用safeApiCall代替直接调用
    return safeApiCall('get_payments')
        .then(payments => {
            if (!payments || !Array.isArray(payments)) {
                console.error('获取结算数据失败:', payments);
                throw new Error('获取结算数据失败');
            }
            
            console.log(`获取到${payments.length}条结算记录`);
            
            // 数据去重 - 根据payment_id去重
            const uniquePayments = [];
            const paymentIds = new Set();
            
            for (const payment of payments) {
                if (!payment.id || paymentIds.has(payment.id)) {
                    console.warn(`发现重复的结算记录ID: ${payment.id || '未知ID'}`);
                    continue;
                }
                paymentIds.add(payment.id);
                uniquePayments.push(payment);
            }
            
            console.log(`去重后有${uniquePayments.length}条结算记录`);
            
            // 存储去重后的数据
            paymentsList = uniquePayments;
            
            // 更新年份筛选选项
            updatePaymentYearOptions(uniquePayments);
            
            // 更新客户筛选选项
            updatePaymentClientOptions();
            
            // 更新结算统计
            updatePaymentStatistics(uniquePayments, periodFilter);
            
            // 获取项目数据，然后渲染结算列表
            return safeApiCall('get_projects')
                .then(projects => {
                    if (!projects || !Array.isArray(projects)) {
                        console.error('获取项目数据失败:', projects);
                        throw new Error('获取项目数据失败');
                    }
                    
                    console.log(`获取到${projects.length}条项目记录`);
                    
                    // 渲染结算列表
                    renderPaymentsList(uniquePayments);
                    renderPaymentItems(uniquePayments, projects);
                    
                    // 更新结算图表
                    updatePaymentsChart(uniquePayments, periodFilter);
                    
                    return uniquePayments;
                })
                .catch(error => {
                    console.error('获取项目数据失败:', error);
                    // 尝试只渲染结算列表，不包含项目信息
                    renderPaymentsList(uniquePayments);
                    throw error;
                });
        })
        .catch(error => {
            console.error('加载结算数据失败:', error);
            showAlert('加载结算数据失败: ' + (error.message || error), '错误');
            
            // 显示空状态
            const paymentsListElement = document.getElementById('payments-list');
            if (paymentsListElement) {
                paymentsListElement.innerHTML = `
                    <div class="empty-state">
                        <p><i class="bi bi-exclamation-triangle"></i> 加载结算数据失败</p>
                        <button class="btn btn-outline-primary" id="retry-load-payments">
                            <i class="bi bi-arrow-clockwise"></i> 重试
                        </button>
                    </div>
                `;
                
                document.getElementById('retry-load-payments')?.addEventListener('click', loadPaymentsData);
            }
            
            return Promise.reject(error);
        })
        .finally(() => {
            // 隐藏加载指示器
            if (paymentsPage) {
                paymentsPage.classList.remove('loading');
            }
        });
}

// 更新收入统计
function updatePaymentStatistics(payments, period) {
    const totalAmountElement = document.getElementById('total-amount');
    const paymentCountElement = document.getElementById('payment-count');
    
    if (!totalAmountElement || !paymentCountElement) return;
    
    // 根据周期筛选支付记录
    let filteredPayments = [...payments];
    
    if (period !== 'all') {
        if (/^\d{4}$/.test(period)) {
            // 如果是年份，筛选该年的支付记录
            filteredPayments = filteredPayments.filter(payment => {
                if (!payment.date) return false;
                const paymentYear = new Date(payment.date).getFullYear().toString();
                return paymentYear === period;
            });
        }
    }
    
    // 计算总金额和数量
    const totalAmount = filteredPayments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    const paymentCount = filteredPayments.length;
    
    // 更新界面
    const formattedAmount = `¥${totalAmount.toFixed(2)}`;
    totalAmountElement.textContent = formattedAmount;
    paymentCountElement.textContent = paymentCount;
    
    // 设置data-length属性以便CSS能够根据数字长度自动调整字体大小
    totalAmountElement.setAttribute('data-length', formattedAmount.length);
    paymentCountElement.setAttribute('data-length', paymentCount.toString().length);
    
    // 更新图表
    updatePaymentsChart(filteredPayments, period);
}

// 辅助函数：更新支付统计UI
function updatePaymentStatsUI(filteredPayments) {
    const totalAmountElement = document.getElementById('total-amount');
    const paymentCountElement = document.getElementById('payment-count');
    
    if (!totalAmountElement || !paymentCountElement) return;
    
    // 计算总金额和数量
    const totalAmount = filteredPayments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    const paymentCount = filteredPayments.length;
    
    // 更新界面
    totalAmountElement.textContent = `¥${totalAmount.toFixed(2)}`;
    paymentCountElement.textContent = paymentCount;
    
    // 设置data-length属性以便CSS能够根据数字长度自动调整字体大小
    totalAmountElement.setAttribute('data-length', totalAmount.toFixed(2).length);
    paymentCountElement.setAttribute('data-length', paymentCount.toString().length);
    
    // 获取当前选中的周期
    const periodFilter = document.getElementById('payment-period-filter')?.value || 'all';
    
    // 更新图表
    updatePaymentsChart(filteredPayments, periodFilter);
}

// 更新结算清单客户筛选下拉框
function updatePaymentClientOptions() {
    const clientFilter = document.getElementById('payment-client-filter');
    if (!clientFilter) return;
    
    // 保存当前选中的值
    const currentValue = clientFilter.value;
    
    // 清空选项（保留"所有客户"选项）
    clientFilter.innerHTML = '<option value="all">所有客户</option>';
    
    // 从项目中提取客户名称
    window.pywebview.api.get_projects(true).then(projects => {
        // 提取所有项目中的客户名称
        const clientsSet = new Set();
        
        projects.forEach(project => {
            const clientMatch = project.name.match(/\[(.*?)\]/);
            if (clientMatch && clientMatch[1]) {
                clientsSet.add(clientMatch[1]);
            }
        });
        
        // 将客户按字母顺序排序
        const sortedClients = Array.from(clientsSet).sort();
        
        // 添加客户选项
        sortedClients.forEach(client => {
            const option = document.createElement('option');
            option.value = client;
            option.textContent = client;
            clientFilter.appendChild(option);
        });
        
        // 恢复之前选中的值（如果存在）
        if (sortedClients.includes(currentValue)) {
            clientFilter.value = currentValue;
        }
        
        console.log('结算清单客户筛选已更新，客户数量:', sortedClients.length);
    }).catch(error => {
        console.error('获取项目数据失败:', error);
    });
}

// 更新支付图表
function updatePaymentsChart(payments, period) {
    const canvas = document.getElementById('payments-chart');
    if (!canvas) return;
    
    // 检查是否已有图表实例
    if (window.paymentsChart) {
        window.paymentsChart.destroy();
    }
    
    // 按日期分组支付记录
    const paymentsByDate = {};
    
    // 决定分组方式和显示格式
    let groupByMonth = false;
    if (period === 'all') {
        // 如果是所有时间，按年份分组
        groupByMonth = false;
    } else if (/^\d{4}$/.test(period)) {
        // 特定年，按月份分组
        groupByMonth = true;
    }
    
    payments.forEach(payment => {
        if (!payment.date) return;
        
        const paymentDate = new Date(payment.date);
        let dateKey;
        
        if (groupByMonth) {
            // 按月分组 (格式: "2023-01")
            const year = paymentDate.getFullYear();
            const month = paymentDate.getMonth() + 1;
            dateKey = `${year}-${month.toString().padStart(2, '0')}`;
        } else {
            // 按年分组
            dateKey = paymentDate.getFullYear().toString();
        }
        
        if (!paymentsByDate[dateKey]) {
            paymentsByDate[dateKey] = 0;
        }
        
        paymentsByDate[dateKey] += parseFloat(payment.amount || 0);
    });
    
    // 排序日期键
    const sortedDates = Object.keys(paymentsByDate).sort();
    
    // 准备图表数据
    const chartData = {
        labels: sortedDates.map(date => {
            if (groupByMonth) {
                // 显示月份 (如 "2023年1月")
                const [year, month] = date.split('-');
                return `${year}年${parseInt(month)}月`;
            } else {
                // 显示年份 (如 "2023年")
                return `${date}年`;
            }
        }),
        datasets: [{
            label: '结算金额',
            data: sortedDates.map(date => paymentsByDate[date]),
            backgroundColor: 'rgba(67, 97, 238, 0.3)',
            borderColor: 'rgba(67, 97, 238, 1)',
            borderWidth: 1
        }]
    };
    
    // 创建图表
    window.paymentsChart = new Chart(canvas, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '¥' + value;
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '¥' + context.raw.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

// Render Payments List
function renderPaymentsList(payments) {
    const paymentsListElement = document.getElementById('payments-list');
    if (!paymentsListElement) return;
    
    // 清空列表
    paymentsListElement.innerHTML = '';
    
    if (!payments || payments.length === 0) {
        paymentsListElement.innerHTML = `
            <div class="empty-state">
                <p><i class="bi bi-emoji-frown"></i>老板一分钱都没发</p>
            </div>
        `;
        
        document.getElementById('goto-projects-btn')?.addEventListener('click', () => {
            changePage('projects', document.querySelector('.nav-item[data-page="projects"]'));
        });
        
        return;
    }
    
    console.log(`开始渲染${payments.length}条结算记录`);
    
    // 获取筛选条件
    const periodFilter = document.getElementById('payment-period-filter')?.value || 'all';
    const searchTerm = document.getElementById('payment-search')?.value.trim().toLowerCase() || '';
    
    // 应用筛选
    let filteredPayments = [...payments];
    
    // 按年份筛选
    if (periodFilter !== 'all') {
        filteredPayments = filteredPayments.filter(payment => {
            if (!payment.date) return false;
            
            const paymentDate = new Date(payment.date);
            const paymentYear = paymentDate.getFullYear().toString();
            
            return paymentYear === periodFilter;
        });
    }
    
    // 按照日期从新到旧排序
    const sortedPayments = [...filteredPayments].sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
    });
    
    console.log(`筛选后有${sortedPayments.length}条结算记录`);
    
    // 获取所有项目（包括已归档的）
    if (checkApiAvailable()) {
        // 使用Promise.all同时获取未归档和已归档项目
        Promise.all([
            safeApiCall('get_projects', false),
            safeApiCall('get_projects', true)
        ])
        .then(([activeProjects, archivedProjects]) => {
            console.log("获取到未归档项目:", activeProjects.length);
            console.log("获取到已归档项目:", archivedProjects.length);
            
            // 合并已归档和未归档的项目列表
            const allProjects = [...activeProjects];
            
            // 添加未包含的已归档项目
            archivedProjects.forEach(archivedProject => {
                if (!allProjects.some(p => p.id === archivedProject.id)) {
                    allProjects.push(archivedProject);
                }
            });
            
            console.log("合并后总项目数:", allProjects.length);
            
            // 如果有搜索关键字，筛选相关项目和支付记录
            let displayPayments = sortedPayments;
            
            if (searchTerm) {
                // 先筛选项目列表以找到包含搜索关键字的项目
                const matchedProjects = allProjects.filter(project => {
                    // 从项目名称中提取客户名称
                    const clientMatch = project.name.match(/\[(.*?)\]/);
                    const clientName = clientMatch ? clientMatch[1].toLowerCase() : '';
                    
                    // 检查项目名称和客户名称是否包含搜索关键字
                    return project.name.toLowerCase().includes(searchTerm) || 
                           clientName.includes(searchTerm);
                });
                
                // 获取匹配项目的ID列表
                const matchedProjectIds = matchedProjects.map(p => p.id);
                
                // 筛选支付记录
                displayPayments = sortedPayments.filter(payment => 
                    matchedProjectIds.includes(payment.project_id)
                );
                
                console.log(`搜索"${searchTerm}"后筛选出${displayPayments.length}条结算记录`);
            }
            
            // 渲染支付项目
            renderPaymentItems(displayPayments, allProjects);
        })
        .catch(error => {
            console.error('获取项目列表失败:', error);
            // 如果API调用失败，使用全局项目列表
            renderPaymentItems(sortedPayments, projectsList);
        });
    } else {
        // 如果API不可用，使用当前项目列表渲染
        renderPaymentItems(sortedPayments, projectsList);
    }
}

// 渲染支付项目列表
function renderPaymentItems(sortedPayments, projects) {
    const paymentsListElement = document.getElementById('payments-list');
    if (!paymentsListElement) return;
    
    // 清空列表，确保不会重复渲染
    paymentsListElement.innerHTML = '';
    
    console.log(`开始渲染${sortedPayments.length}条结算记录项目`);
    
    // 跟踪已渲染的支付ID，避免重复
    const renderedPaymentIds = new Set();
    
    sortedPayments.forEach(payment => {
        // 跳过重复的支付记录
        if (renderedPaymentIds.has(payment.id)) {
            console.warn(`跳过重复的结算记录ID: ${payment.id}`);
            return;
        }
        
        // 记录此ID已被渲染
        renderedPaymentIds.add(payment.id);
        
        const paymentElement = document.createElement('div');
        paymentElement.className = 'payment-item';
        paymentElement.setAttribute('data-payment-id', payment.id);
        
        // 获取项目信息（如果有）
        let projectName = '未关联项目';
        let projectElement = '';
        
        if (payment.project_id) {
            const project = projects.find(p => p.id === payment.project_id);
            if (project) {
                projectName = project.name;
                
                // 提取客户名称
                let clientName = '';
                const clientMatch = projectName.match(/\[(.*?)\]/);
                if (clientMatch && clientMatch[1]) {
                    clientName = clientMatch[1];
                }
                
                // 格式化项目名称
                let formattedName = projectName;
                if (clientName) {
                    formattedName = projectName.replace(`[${clientName}]`, `<span class="client-badge">${clientName}</span>`);
                }
                
                projectElement = `
                    <div class="payment-project">
                        <i class="bi bi-folder"></i> ${formattedName}
                    </div>
                `;
            }
        }
        
        const amount = parseFloat(payment.amount);
        const formattedAmount = isNaN(amount) ? '0.00' : amount.toFixed(2);
        
        paymentElement.innerHTML = `
            <div class="payment-icon">
                <i class="bi bi-cash-coin"></i>
            </div>
            <div class="payment-content">
                ${projectElement}
                <div class="payment-details">
                    <span>
                        <i class="bi bi-calendar"></i> ${formatDate(payment.date)}
                    </span>
                    ${payment.notes ? `<span><i class="bi bi-card-text"></i> ${payment.notes}</span>` : ''}
                </div>
            </div>
            <div class="payment-amount">¥${formattedAmount}</div>
            <div class="payment-actions">
                <button class="btn btn-sm btn-outline-danger delete-payment-btn" data-payment-id="${payment.id}">
                    <i class="bi bi-trash"></i>
                </button>
                <button class="btn btn-sm btn-outline-primary edit-payment-btn" data-payment-id="${payment.id}">
                    <i class="bi bi-pencil"></i>
                </button>
            </div>
        `;
        
        // 添加到列表
        paymentsListElement.appendChild(paymentElement);
        
        // 添加删除按钮事件监听
        const deleteBtn = paymentElement.querySelector('.delete-payment-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', deletePayment);
        }
        
        // 添加编辑按钮事件监听
        const editBtn = paymentElement.querySelector('.edit-payment-btn');
        if (editBtn) {
            editBtn.addEventListener('click', openEditPaymentModal);
        }
    });
    
    console.log(`实际渲染了${renderedPaymentIds.size}条结算记录`);
}

// Open Edit Payment Modal
function openEditPaymentModal(event) {
    const paymentId = event.currentTarget.getAttribute('data-payment-id');
    const payment = paymentsList.find(p => p.id === parseInt(paymentId));
    
    if (!payment) return;
    
    const paymentForm = document.getElementById('payment-form');
    const paymentModal = new bootstrap.Modal(document.getElementById('payment-modal'));
    
    // Fill form with payment data
    document.getElementById('payment-id').value = payment.id;
    document.getElementById('payment-amount').value = payment.amount;
    document.getElementById('payment-date').value = payment.date;
    document.getElementById('payment-notes').value = payment.notes || '';
    
    // 查找关联的项目
    const project = projectsList.find(p => p.id === payment.project_id);
    const projectName = project ? project.name : '未知项目';
    
    // 设置模态框标题
    document.querySelector('#payment-modal .modal-title').textContent = '编辑支付';
    
    // 隐藏项目选择下拉框，显示项目名称文本
    const projectSelect = document.getElementById('payment-project-container');
    if (projectSelect) {
        projectSelect.innerHTML = `
            <div class="mb-3">
                <label for="payment-project-display" class="form-label">关联项目</label>
                <input type="text" class="form-control" id="payment-project-display" value="${projectName}" disabled>
                <input type="hidden" id="payment-project" value="${payment.project_id}">
            </div>
        `;
    }
    
    paymentModal.show();
}

// Delete Payment
function deletePayment(event) {
    const paymentId = event.currentTarget.getAttribute('data-payment-id');
    
    if (!paymentId || !window.pywebview) {
        showAlert('系统API未就绪，请稍后重试', '错误');
        return;
    }
    
    // 确认删除
    showConfirm('确定要删除这条结算记录吗？此操作不可恢复，并且可能会将相关项目恢复为未结算状态。', function(confirmed) {
        if (confirmed) {
            window.pywebview.api.delete_payment(parseInt(paymentId)).then(result => {
                if (result.success) {
                    // 删除成功后刷新结算数据
                    loadPaymentsData();
                    
                    // 可能需要刷新项目列表，因为删除结算可能会影响项目的结算状态
                    if (document.getElementById('projects-page').classList.contains('active')) {
                        loadProjectsData();
                    }
                    
                    // 显示成功消息
                    showAlert('结算记录已成功删除', '操作成功');
                } else {
                    showAlert(result.error || '删除结算记录失败', '错误');
                }
            }).catch(handleApiError);
        }
    }, '删除结算记录');
}

// 加载客户选项列表
function loadClientsOptions() {
    const clientDatalist = document.getElementById('client-options');
    if (!clientDatalist) return;
    
    // 清空现有选项
    clientDatalist.innerHTML = '';
    
    // 从完成项目模块中提取所有客户名称
    if (window.pywebview) {
        // 获取所有项目(包括已归档的)
        window.pywebview.api.get_projects(true).then(projects => {
            // 提取客户名称 - 从项目名称中提取 [客户名称] 格式的信息
            let extractedClients = [];
            
            projects.forEach(project => {
                // 检查项目名称是否包含 [客户名称] 格式
                const clientMatch = project.name.match(/\[(.*?)\]/);
                if (clientMatch && clientMatch[1]) {
                    // 提取客户名称
                    extractedClients.push(clientMatch[1]);
                }
                
                // 从备注中提取客户名称（如果备注中包含"客户:"前缀）
                if (project.notes && project.notes.includes('客户:')) {
                    const notesClientMatch = project.notes.match(/客户:\s*([^\n]+)/);
                    if (notesClientMatch && notesClientMatch[1]) {
                        extractedClients.push(notesClientMatch[1].trim());
                    }
                }
            });
            
            // 去重
            clientsList = [...new Set(extractedClients)];
            
            // 排序
            clientsList.sort();
            
            // 添加到datalist
            clientsList.forEach(client => {
                const option = document.createElement('option');
                option.value = client;
                clientDatalist.appendChild(option);
            });
            
            console.log('客户列表已从项目中更新:', clientsList.length);
        }).catch(error => {
            console.error('获取项目列表失败:', error);
        });
    } else {
        console.warn('PyWebView API not available, unable to load clients from projects');
    }
}

// 加载任务类别选项列表
function loadCategoriesOptions() {
    const categoryDatalist = document.getElementById('category-options');
    if (!categoryDatalist) return;
    
    // 清空现有选项
    categoryDatalist.innerHTML = '';
    
    // 从完成项目模块中提取所有不同的项目类型作为任务类别
    if (window.pywebview) {
        // 获取所有项目(包括已归档的)
        window.pywebview.api.get_projects(true).then(projects => {
            // 提取项目类型
            let extractedTypes = [];
            
            projects.forEach(project => {
                // 从项目类型字段提取
                if (project.type && project.type.trim() !== '') {
                    extractedTypes.push(project.type.trim());
                }
            });
            
            // 去重
            categoriesList = [...new Set(extractedTypes)];
            
            // 排序
            categoriesList.sort();
            
            // 添加到datalist
            categoriesList.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                categoryDatalist.appendChild(option);
            });
            
            console.log('任务类别列表已从项目中更新:', categoriesList.length);
        }).catch(error => {
            console.error('获取项目列表失败:', error);
        });
    } else {
        console.warn('PyWebView API not available, unable to load categories from projects');
    }
}

// 重启应用程序
function restartApplication() {
    if (!checkApiAvailable()) {
        showAlert('系统API未就绪，请稍后重试', '错误');
        return;
    }
    
    showConfirm('确定要重启应用程序吗？', function() {
        safeApiCall('restart_application')
            .then(result => {
                // 重启过程由后端处理，这里不需要做任何事情
                console.log('应用程序重启中...');
            })
            .catch(error => {
                console.error('重启应用程序失败:', error);
                showAlert('重启应用程序失败: ' + (error.message || error), '错误');
            });
    });
}

// 根据关键词过滤客户选项
function filterClientOptions(keyword) {
    const clientDatalist = document.getElementById('client-options');
    if (!clientDatalist) return;
    
    // 清空现有选项
    clientDatalist.innerHTML = '';
    
    if (!keyword || keyword.trim() === '') {
        // 如果没有关键词，显示所有客户
        clientsList.forEach(client => {
            const option = document.createElement('option');
            option.value = client;
            clientDatalist.appendChild(option);
        });
        return;
    }
    
    // 如果有关键词，过滤包含关键词的客户
    const filteredClients = clientsList.filter(client => {
        // 转换为小写并比较，确保不区分大小写
        // 对于中文和其他非拉丁字符，直接使用 includes 比较
        if (client && keyword) {
            return client.toLowerCase().includes(keyword.toLowerCase());
        }
        return false;
    });
    
    // 添加到datalist
    filteredClients.forEach(client => {
        const option = document.createElement('option');
        option.value = client;
        clientDatalist.appendChild(option);
    });
    
    console.log(`客户列表已过滤，关键词: "${keyword}"，匹配数: ${filteredClients.length}，总客户数: ${clientsList.length}`);
}

// 根据关键词过滤类别选项
function filterCategoryOptions(keyword) {
    const categoryDatalist = document.getElementById('category-options');
    if (!categoryDatalist) return;
    
    // 清空现有选项
    categoryDatalist.innerHTML = '';
    
    if (!keyword || keyword.trim() === '') {
        // 如果没有关键词，显示所有类别
        categoriesList.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            categoryDatalist.appendChild(option);
        });
        return;
    }
    
    // 如果有关键词，过滤包含关键词的类别
    const filteredCategories = categoriesList.filter(category => {
        // 转换为小写并比较，确保不区分大小写
        // 对于中文和其他非拉丁字符，直接使用 includes 比较
        if (category && keyword) {
            return category.toLowerCase().includes(keyword.toLowerCase());
        }
        return false;
    });
    
    // 添加到datalist
    filteredCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        categoryDatalist.appendChild(option);
    });
    
    console.log(`类别列表已过滤，关键词: "${keyword}"，匹配数: ${filteredCategories.length}，总类别数: ${categoriesList.length}`);
}

// =======================
// Client Management
// =======================

// 打开客户列表管理模态框
function openClientsModal() {
    if (!checkApiAvailable()) {
        showAlert('系统API未就绪，请稍后重试', '错误');
        return;
    }
    
    // 加载客户列表
    safeApiCall('get_clients')
        .then(clients => {
            renderClientsList(clients);
            
            // 显示模态框
            const clientsModal = new bootstrap.Modal(document.getElementById('clients-modal'));
            clientsModal.show();
            
            // 聚焦到输入框
            setTimeout(() => {
                document.getElementById('new-client-name').focus();
            }, 500);
        })
        .catch(error => {
            console.error('获取客户列表失败:', error);
            showAlert('获取客户列表失败', '错误');
        });
}

// 渲染客户列表
function renderClientsList(clients) {
    const clientsListTable = document.getElementById('clients-list-table');
    if (!clientsListTable) return;
    
    clientsListTable.innerHTML = '';
    
    if (clients.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="2" class="text-center">暂无客户，请添加</td>';
        clientsListTable.appendChild(emptyRow);
        return;
    }
    
    clients.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client.name}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-danger delete-client-btn" data-client-id="${client.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        clientsListTable.appendChild(row);
    });
    
    // 添加删除按钮事件
    document.querySelectorAll('.delete-client-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const clientId = this.getAttribute('data-client-id');
            deleteClient(clientId);
        });
    });
    
    // 更新客户列表全局变量
    clientsList = clients.map(client => client.name);
    
    // 更新任务表单中的客户datalist
    updateClientDatalist();
}

// 添加新客户
function addClient() {
    const newClientName = document.getElementById('new-client-name').value.trim();
    
    if (!newClientName) {
        showAlert('请输入客户名称', '表单验证');
        return;
    }
    
    if (!checkApiAvailable()) {
        showAlert('系统API未就绪，请稍后重试', '错误');
        return;
    }
    
    safeApiCall('add_client', newClientName)
        .then(result => {
            if (result.error) {
                showAlert(result.error, '错误');
                return;
            }
            
            // 清空输入框
            document.getElementById('new-client-name').value = '';
            
            // 重新加载客户列表
            safeApiCall('get_clients')
                .then(clients => {
                    renderClientsList(clients);
                    showAlert('客户添加成功', '成功');
                })
                .catch(error => {
                    console.error('获取客户列表失败:', error);
                });
        })
        .catch(error => {
            console.error('添加客户失败:', error);
            showAlert('添加客户失败', '错误');
        });
}

// 删除客户
function deleteClient(clientId) {
    if (!checkApiAvailable()) {
        showAlert('系统API未就绪，请稍后重试', '错误');
        return;
    }
    
    showConfirm('确定要删除这个客户吗？删除后无法恢复。', function(confirmed) {
        if (confirmed) {
            safeApiCall('delete_client', parseInt(clientId))
                .then(result => {
                    if (result.error) {
                        showAlert(result.error, '错误');
                        return;
                    }
                    
                    // 重新加载客户列表
                    safeApiCall('get_clients')
                        .then(clients => {
                            renderClientsList(clients);
                            showAlert('客户删除成功', '成功');
                        })
                        .catch(error => {
                            console.error('获取客户列表失败:', error);
                        });
                })
                .catch(error => {
                    console.error('删除客户失败:', error);
                    showAlert('删除客户失败', '错误');
                });
        }
    }, '删除确认');
}

// 更新任务表单中的客户datalist
function updateClientDatalist() {
    const clientDatalist = document.getElementById('client-options');
    if (!clientDatalist) return;
    
    // 清空现有选项
    clientDatalist.innerHTML = '';
    
    // 添加客户选项
    clientsList.forEach(client => {
        const option = document.createElement('option');
        option.value = client;
        clientDatalist.appendChild(option);
    });
}

// =======================
// Category Management
// =======================

// 打开项目类型管理模态框
function openCategoriesModal() {
    if (!checkApiAvailable()) {
        showAlert('系统API未就绪，请稍后重试', '错误');
        return;
    }
    
    // 加载项目类型列表
    safeApiCall('get_categories')
        .then(categories => {
            renderCategoriesList(categories);
            
            // 显示模态框
            const categoriesModal = new bootstrap.Modal(document.getElementById('categories-modal'));
            categoriesModal.show();
            
            // 聚焦到输入框
            setTimeout(() => {
                document.getElementById('new-category-name').focus();
            }, 500);
        })
        .catch(error => {
            console.error('获取项目类型列表失败:', error);
            showAlert('获取项目类型列表失败', '错误');
        });
}

// 渲染项目类型列表
function renderCategoriesList(categories) {
    const categoriesListTable = document.getElementById('categories-list-table');
    if (!categoriesListTable) return;
    
    categoriesListTable.innerHTML = '';
    
    if (categories.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="2" class="text-center">暂无项目类型，请添加</td>';
        categoriesListTable.appendChild(emptyRow);
        return;
    }
    
    categories.forEach(category => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${category.name}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-danger delete-category-btn" data-category-id="${category.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        categoriesListTable.appendChild(row);
    });
    
    // 添加删除按钮事件
    document.querySelectorAll('.delete-category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const categoryId = this.getAttribute('data-category-id');
            deleteCategory(categoryId);
        });
    });
    
    // 更新项目类型列表全局变量
    categoriesList = categories.map(category => category.name);
    
    // 更新任务表单中的项目类型datalist
    updateCategoryDatalist();
}

// 添加新项目类型
function addCategory() {
    const newCategoryName = document.getElementById('new-category-name').value.trim();
    
    if (!newCategoryName) {
        showAlert('请输入项目类型名称', '表单验证');
        return;
    }
    
    if (!checkApiAvailable()) {
        showAlert('系统API未就绪，请稍后重试', '错误');
        return;
    }
    
    safeApiCall('add_category', newCategoryName)
        .then(result => {
            if (result.error) {
                showAlert(result.error, '错误');
                return;
            }
            
            // 清空输入框
            document.getElementById('new-category-name').value = '';
            
            // 重新加载项目类型列表
            safeApiCall('get_categories')
                .then(categories => {
                    renderCategoriesList(categories);
                    showAlert('项目类型添加成功', '成功');
                })
                .catch(error => {
                    console.error('获取项目类型列表失败:', error);
                });
        })
        .catch(error => {
            console.error('添加项目类型失败:', error);
            showAlert('添加项目类型失败', '错误');
        });
}

// 删除项目类型
function deleteCategory(categoryId) {
    if (!checkApiAvailable()) {
        showAlert('系统API未就绪，请稍后重试', '错误');
        return;
    }
    
    showConfirm('确定要删除这个项目类型吗？删除后无法恢复。', function(confirmed) {
        if (confirmed) {
            safeApiCall('delete_category', parseInt(categoryId))
                .then(result => {
                    if (result.error) {
                        showAlert(result.error, '错误');
                        return;
                    }
                    
                    // 重新加载项目类型列表
                    safeApiCall('get_categories')
                        .then(categories => {
                            renderCategoriesList(categories);
                            showAlert('项目类型删除成功', '成功');
                        })
                        .catch(error => {
                            console.error('获取项目类型列表失败:', error);
                        });
                })
                .catch(error => {
                    console.error('删除项目类型失败:', error);
                    showAlert('删除项目类型失败', '错误');
                });
        }
    }, '删除确认');
}

// 更新任务表单中的项目类型datalist
function updateCategoryDatalist() {
    const categoryDatalist = document.getElementById('category-options');
    if (!categoryDatalist) return;
    
    // 清空现有选项
    categoryDatalist.innerHTML = '';
    
    // 添加项目类型选项
    categoriesList.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        categoryDatalist.appendChild(option);
    });
}

// 从数据库加载客户列表
function loadClientsFromDatabase() {
    if (!window.pywebview) {
        console.warn('PyWebView API not available, unable to load clients');
        return;
    }
    
    window.pywebview.api.get_clients()
        .then(clients => {
            // 更新客户列表全局变量
            clientsList = clients.map(client => client.name);
            
            // 更新任务表单中的客户datalist
            updateClientDatalist();
            
            console.log('客户列表已从数据库加载:', clientsList.length);
        })
        .catch(error => {
            console.error('获取客户列表失败:', error);
        });
}

// 从数据库加载项目类型列表
function loadCategoriesFromDatabase() {
    if (!window.pywebview) {
        console.warn('PyWebView API not available, unable to load categories');
        return;
    }
    
    window.pywebview.api.get_categories()
        .then(categories => {
            // 更新项目类型列表全局变量
            categoriesList = categories.map(category => category.name);
            
            // 更新任务表单中的项目类型datalist
            updateCategoryDatalist();
            
            console.log('项目类型列表已从数据库加载:', categoriesList.length);
        })
        .catch(error => {
            console.error('获取项目类型列表失败:', error);
        });
}

// 打开网站类型管理模态框
function openWebsitesModal() {
    if (!checkApiAvailable()) {
        showAlert('系统API未就绪，请稍后重试', '错误');
        return;
    }
    
    // 加载网站类型列表
    safeApiCall('get_websites')
        .then(websites => {
            renderWebsitesList(websites);
            
            // 显示模态框
            const websitesModal = new bootstrap.Modal(document.getElementById('websites-modal'));
            websitesModal.show();
            
            // 聚焦到输入框
            setTimeout(() => {
                document.getElementById('new-website-name').focus();
            }, 500);
        })
        .catch(error => {
            console.error('获取网站类型列表失败:', error);
            showAlert('获取网站类型列表失败', '错误');
        });
}

// 渲染网站类型列表
function renderWebsitesList(websites) {
    const websitesListTable = document.getElementById('websites-list-table');
    if (!websitesListTable) return;
    
    websitesListTable.innerHTML = '';
    
    if (websites.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="3" class="text-center">暂无网站类型，请添加</td>';
        websitesListTable.appendChild(emptyRow);
        return;
    }
    
    websites.forEach(website => {
        const row = document.createElement('tr');
        
        // 格式化URL显示
        const urlDisplay = website.url ? 
            `<a href="${website.url}" target="_blank" title="${website.url}">${formatUrl(website.url)}</a>` : 
            '<span class="text-muted">未设置</span>';
        
        row.innerHTML = `
            <td>${website.name}</td>
            <td>${urlDisplay}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary edit-website-btn me-1" data-website-id="${website.id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-website-btn" data-website-id="${website.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        websitesListTable.appendChild(row);
    });
    
    // 添加编辑按钮事件
    document.querySelectorAll('.edit-website-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const websiteId = this.getAttribute('data-website-id');
            openEditWebsiteModal(websiteId);
        });
    });
    
    // 添加删除按钮事件
    document.querySelectorAll('.delete-website-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const websiteId = this.getAttribute('data-website-id');
            deleteWebsite(websiteId);
        });
    });
    
    // 更新网站类型列表全局变量
    websitesList = websites;
    
    // 更新账号表单中的网站类型datalist
    updateWebsiteDatalist();
}

// 格式化URL显示
function formatUrl(url) {
    if (!url) return '';
    
    // 移除协议部分
    let formattedUrl = url.replace(/^(https?:\/\/)/, '');
    
    // 如果URL太长，截断显示
    if (formattedUrl.length > 30) {
        formattedUrl = formattedUrl.substring(0, 27) + '...';
    }
    
    return formattedUrl;
}

// 打开编辑网站类型模态框
function openEditWebsiteModal(websiteId) {
    const website = websitesList.find(w => w.id === parseInt(websiteId));
    
    if (!website) {
        showAlert('找不到指定的网站类型', '错误');
        return;
    }
    
    // 填充表单
    document.getElementById('edit-website-id').value = website.id;
    document.getElementById('edit-website-name').value = website.name || '';
    document.getElementById('edit-website-url').value = website.url || '';
    document.getElementById('edit-website-description').value = website.description || '';
    
    // 显示模态框
    const editWebsiteModal = new bootstrap.Modal(document.getElementById('edit-website-modal'));
    editWebsiteModal.show();
}

// 保存网站类型编辑
function saveWebsite() {
    const websiteId = document.getElementById('edit-website-id').value;
    const name = document.getElementById('edit-website-name').value.trim();
    const url = document.getElementById('edit-website-url').value.trim();
    const description = document.getElementById('edit-website-description').value.trim();
    
    if (!name) {
        showAlert('请输入网站类型名称', '表单验证');
        return;
    }
    
    if (!checkApiAvailable()) {
        showAlert('系统API未就绪，请稍后重试', '错误');
        return;
    }
    
    const params = {
        name: name,
        url: url,
        description: description
    };
    
    window.pywebview.api.update_website(parseInt(websiteId), params)
        .then(result => {
            if (result.error) {
                showAlert(result.error, '错误');
                return;
            }
            
            // 关闭模态框
            bootstrap.Modal.getInstance(document.getElementById('edit-website-modal')).hide();
            
            // 重新加载网站类型列表
            window.pywebview.api.get_websites()
                .then(websites => {
                    renderWebsitesList(websites);
                    showAlert('网站类型更新成功', '成功');
                })
                .catch(error => {
                    console.error('获取网站类型列表失败:', error);
                });
        })
        .catch(error => {
            console.error('更新网站类型失败:', error);
            showAlert('更新网站类型失败', '错误');
        });
}

// 添加新网站类型
function addWebsite() {
    const newWebsiteName = document.getElementById('new-website-name').value.trim();
    const newWebsiteUrl = document.getElementById('new-website-url').value.trim();
    
    if (!newWebsiteName) {
        showAlert('请输入网站类型名称', '表单验证');
        return;
    }
    
    if (!window.pywebview) {
        showAlert('系统API未就绪，请稍后重试', '错误');
        return;
    }
    
    window.pywebview.api.add_website(newWebsiteName, newWebsiteUrl)
        .then(result => {
            if (result.error) {
                showAlert(result.error, '错误');
                return;
            }
            
            // 清空输入框
            document.getElementById('new-website-name').value = '';
            document.getElementById('new-website-url').value = '';
            
            // 重新加载网站类型列表
            window.pywebview.api.get_websites()
                .then(websites => {
                    renderWebsitesList(websites);
                    showAlert('网站类型添加成功', '成功');
                })
                .catch(error => {
                    console.error('获取网站类型列表失败:', error);
                });
        })
        .catch(error => {
            console.error('添加网站类型失败:', error);
            showAlert('添加网站类型失败', '错误');
        });
}

// 删除网站类型
function deleteWebsite(websiteId) {
    if (!window.pywebview) {
        showAlert('系统API未就绪，请稍后重试', '错误');
        return;
    }
    
    showConfirm('确定要删除这个网站类型吗？删除后无法恢复。', function(confirmed) {
        if (confirmed) {
            window.pywebview.api.delete_website(parseInt(websiteId))
                .then(result => {
                    if (result.error) {
                        showAlert(result.error, '错误');
                        return;
                    }
                    
                    // 重新加载网站类型列表
                    window.pywebview.api.get_websites()
                        .then(websites => {
                            renderWebsitesList(websites);
                            showAlert('网站类型删除成功', '成功');
                        })
                        .catch(error => {
                            console.error('获取网站类型列表失败:', error);
                        });
                })
                .catch(error => {
                    console.error('删除网站类型失败:', error);
                    showAlert('删除网站类型失败', '错误');
                });
        }
    }, '删除确认');
}

// 更新网站类型下拉列表
function updateWebsiteDatalist() {
    const websiteDatalist = document.getElementById('website-options');
    if (!websiteDatalist) return;
    
    // 清空现有选项
    websiteDatalist.innerHTML = '';
    
    // 添加网站类型选项
    // 根据websitesList的数据格式进行适当处理
    if (Array.isArray(websitesList)) {
        if (websitesList.length > 0) {
            // 检查第一个元素是对象还是字符串
            if (typeof websitesList[0] === 'string') {
                // 如果是字符串数组，直接使用
                websitesList.forEach(websiteName => {
                    const option = document.createElement('option');
                    option.value = websiteName;
                    websiteDatalist.appendChild(option);
                });
            } else if (typeof websitesList[0] === 'object' && websitesList[0] !== null) {
                // 如果是对象数组，使用name属性
                websitesList.forEach(website => {
                    if (website && website.name) {
                        const option = document.createElement('option');
                        option.value = website.name;
                        websiteDatalist.appendChild(option);
                    }
                });
            }
        }
    }
    
    console.log('已更新网站类型下拉列表，选项数量:', websiteDatalist.options.length);
}

// 打开项目结算模态框
function openSettleProjectModal(event) {
    const projectId = event.currentTarget.getAttribute('data-project-id');
    const project = projectsList.find(p => p.id === parseInt(projectId));
    
    if (!project) {
        showAlert('找不到项目信息', '错误');
        return;
    }
    
    // 检查项目是否已结算
    if (project.payment_status === 'paid') {
        showAlert('该项目已结算，不能重复结算', '提示');
        return;
    }
    
    const settleProjectModal = new bootstrap.Modal(document.getElementById('settle-project-modal'));
    
    // 设置项目ID
    document.getElementById('settle-project-id').value = project.id;
    
    // 提取客户名称
    let clientName = '';
    const clientMatch = project.name.match(/\[(.*?)\]/);
    if (clientMatch && clientMatch[1]) {
        clientName = clientMatch[1];
    }
    
    // 格式化项目名称（移除客户前缀部分）
    let projectName = project.name;
    if (clientName) {
        projectName = project.name.replace(`[${clientName}]`, '').trim();
    }
    
    // 填充项目信息字段
    document.getElementById('project-client').textContent = clientName || '无客户信息';
    document.getElementById('project-name-display').textContent = projectName;
    document.getElementById('project-type-display').textContent = project.type || '未分类';
    document.getElementById('project-quantity-display').textContent = project.quantity || '1';
    document.getElementById('project-completion-date').textContent = formatDate(project.completion_date);
    
    // 设置当前日期为默认结算日期
    document.getElementById('settlement-date').valueAsDate = new Date();
    
    // 建议结算金额（根据数量计算）
    const quantity = parseInt(project.quantity) || 1;
    const basePrice = 100; // 基础单价，可以根据项目类型调整
    const suggestedAmount = quantity * basePrice;
    document.getElementById('settlement-amount').value = suggestedAmount;
    
    // 重置备注
    document.getElementById('settlement-notes').value = '';
    
    // 重置按钮状态
    const settleButton = document.querySelector('#settle-project-modal .btn-primary');
    if (settleButton) {
        settleButton.disabled = false;
        settleButton.innerHTML = '确认结算';
    }
    
    // 显示模态框
    settleProjectModal.show();
    
    // 聚焦到金额输入框
    setTimeout(() => {
        document.getElementById('settlement-amount').focus();
        document.getElementById('settlement-amount').select();
    }, 500);
}

// 结算项目
function settleProject() {
    const projectId = document.getElementById('settle-project-id').value;
    const amount = parseFloat(document.getElementById('settlement-amount').value);
    const date = document.getElementById('settlement-date').value;
    const notes = document.getElementById('settlement-notes').value;
    
    if (!projectId || isNaN(amount) || amount <= 0) {
        showAlert('请输入有效的结算金额', '表单验证');
        return;
    }
    
    // 禁用结算按钮，防止重复点击
    const settleButton = document.querySelector('#settle-project-modal .btn-primary');
    if (settleButton) {
        settleButton.disabled = true;
        settleButton.textContent = '处理中...';
    }
    
    // 添加超时处理
    const timeoutId = setTimeout(() => {
        if (settleButton) {
            settleButton.disabled = false;
            settleButton.textContent = '确认结算';
        }
        showAlert('结算操作超时，请重启应用后重试', '错误');
    }, 5000);
    
    // 添加结算记录
    window.pywebview.api.add_payment(parseInt(projectId), amount, date, notes)
        .then(result => {
            // 清除超时
            clearTimeout(timeoutId);
            
            // 恢复按钮状态
            if (settleButton) {
                settleButton.disabled = false;
                settleButton.textContent = '确认结算';
            }
            
            // 检查是否有错误
            if (result && typeof result === 'object' && result.error) {
                showAlert(result.error, '结算失败');
                return;
            }
            
            // 隐藏模态框
            bootstrap.Modal.getInstance(document.getElementById('settle-project-modal')).hide();
            
            // 显示成功提示
            showAlert(`项目结算成功，金额: ¥${amount}`, '结算完成');
            
            // 等待一小段时间再刷新数据，避免后端数据尚未完全更新
            setTimeout(() => {
                // 更新项目列表
                loadProjectsData();
                
                // 如果在结算清单页面，刷新结算列表
                const paymentsPage = document.getElementById('payments-page');
                if (paymentsPage && paymentsPage.classList.contains('active')) {
                    loadPaymentsData();
                }
            }, 800);
        })
        .catch(error => {
            // 清除超时
            clearTimeout(timeoutId);
            
            // 恢复按钮状态
            if (settleButton) {
                settleButton.disabled = false;
                settleButton.textContent = '确认结算';
            }
            
            console.error('结算项目失败:', error);
            showAlert('结算项目失败，请重启应用后重试', '错误');
        });
}

// 设置结算页面相关事件监听
function setupPaymentsEventListeners() {
    // 添加结算筛选器变更事件监听
    const paymentPeriodFilter = document.getElementById('payment-period-filter');
    if (paymentPeriodFilter) {
        paymentPeriodFilter.addEventListener('change', function() {
            const periodFilter = this.value;
            updatePaymentStatistics(paymentsList, periodFilter);
            renderPaymentsList(paymentsList);
        });
    }
    
    // 搜索框事件监听
    const paymentSearch = document.getElementById('payment-search');
    if (paymentSearch) {
        paymentSearch.addEventListener('input', function() {
            renderPaymentsList(paymentsList);
        });
    }
    
    // 清除搜索按钮事件监听
    const clearPaymentSearch = document.getElementById('clear-payment-search');
    if (clearPaymentSearch) {
        clearPaymentSearch.addEventListener('click', function() {
            const paymentSearch = document.getElementById('payment-search');
            if (paymentSearch) {
                paymentSearch.value = '';
                renderPaymentsList(paymentsList);
            }
        });
    }
    
    // 添加结算按钮事件监听
    const addPaymentBtn = document.getElementById('add-payment-btn');
    if (addPaymentBtn) {
        addPaymentBtn.addEventListener('click', openAddPaymentModal);
    }
    
    // 保存结算按钮事件监听
    const savePaymentBtn = document.getElementById('save-payment-btn');
    if (savePaymentBtn) {
        savePaymentBtn.addEventListener('click', savePayment);
    }
    
    // 确保支付模态框中有项目选择容器
    const paymentModal = document.getElementById('payment-modal');
    if (paymentModal) {
        const modalBody = paymentModal.querySelector('.modal-body');
        if (modalBody) {
            // 检查是否已存在项目选择容器
            let projectContainer = modalBody.querySelector('#payment-project-container');
            if (!projectContainer) {
                // 如果不存在，创建一个
                projectContainer = document.createElement('div');
                projectContainer.id = 'payment-project-container';
                
                // 获取金额输入框的父元素
                const amountContainer = modalBody.querySelector('#payment-amount').closest('.mb-3');
                if (amountContainer) {
                    // 在金额输入框之前插入项目选择容器
                    amountContainer.parentNode.insertBefore(projectContainer, amountContainer);
                } else {
                    // 如果找不到金额输入框，就插入到模态框主体的开头
                    modalBody.insertBefore(projectContainer, modalBody.firstChild);
                }
            }
        }
    }
}

// 更新结算年份筛选器选项
function updatePaymentYearOptions(payments) {
    const periodFilter = document.getElementById('payment-period-filter');
    if (!periodFilter) {
        console.warn('未找到结算周期筛选器元素');
        return;
    }
    
    // 保存当前选择
    const currentSelection = periodFilter.value;
    console.log('当前选择的筛选周期:', currentSelection);
    
    // 收集所有结算记录的年份
    const yearsSet = new Set();
    const currentYear = new Date().getFullYear();
    
    // 从结算记录中收集年份
    payments.forEach(payment => {
        if (payment.date) {
            const paymentYear = new Date(payment.date).getFullYear();
            yearsSet.add(paymentYear);
        }
    });
    
    // 确保包含2022年到当前年份的所有年份
    for (let year = 2022; year <= currentYear; year++) {
        yearsSet.add(year);
    }
    
    console.log("结算清单中检测到的年份:", Array.from(yearsSet));
    
    // 转换为数组并排序（从最近年份到最早年份）
    const years = Array.from(yearsSet).sort((a, b) => b - a);
    
    console.log('筛选器更新前的选项数量:', periodFilter.options.length);
    
    // 只保留第一个选项（"所有时间"）
    while (periodFilter.options.length > 1) {
        periodFilter.remove(1);
    }
    
    // 添加年份选项
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year.toString();
        option.textContent = `${year}年`;
        // 如果是当前年份，设为选中状态
        if (year === currentYear && currentSelection === 'current_year') {
            option.selected = true;
        }
        periodFilter.appendChild(option);
    });
    
    console.log('筛选器更新后的选项数量:', periodFilter.options.length);
    console.log('筛选器选项:', Array.from(periodFilter.options).map(opt => ({ value: opt.value, text: opt.textContent })));
    
    // 尝试恢复之前的选择
    if (currentSelection && currentSelection !== 'current_year' && 
        periodFilter.querySelector(`option[value="${currentSelection}"]`)) {
        periodFilter.value = currentSelection;
        console.log('已恢复之前的选择:', currentSelection);
    }
}

// 更新任务状态徽章
function updateTaskStatusBadge() {
    const statusBadge = document.getElementById('task-status-badge');
    if (!statusBadge) return;
    
    // 获取当前筛选状态
    const statusFilter = document.getElementById('task-status-filter')?.value || 'all';
    const priorityFilter = document.getElementById('task-priority-filter')?.value || 'all';
    
    // 应用筛选
    let filteredTasks = [...tasksList];
    
    if (statusFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
    }
    
    if (priorityFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
    }
    
    // 更新徽章数量
    statusBadge.textContent = filteredTasks.length;
}

// 修改任务状态筛选器事件
function setupTaskFilterEventListeners() {
    const statusFilter = document.getElementById('task-status-filter');
    const priorityFilter = document.getElementById('task-priority-filter');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            renderTasksList(tasksList);
            updateTaskStatusBadge();
        });
    }
    
    if (priorityFilter) {
        priorityFilter.addEventListener('change', function() {
            renderTasksList(tasksList);
            updateTaskStatusBadge();
        });
    }
}

// 导出数据功能
function exportData() {
    const dataType = document.getElementById('export-type').value;
    const format = document.getElementById('export-format').value;
    
    if (!dataType) {
        showAlert('请选择要导出的数据类型', '导出错误');
        return;
    }
    
    // 禁用导出按钮，防止重复点击
    const exportBtn = document.getElementById('export-btn');
    const originalText = exportBtn.innerHTML;
    exportBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> 导出中...';
    exportBtn.disabled = true;
    
    safeApiCall('export_data', dataType, format)
        .then(result => {
            // 恢复按钮状态
            exportBtn.innerHTML = originalText;
            exportBtn.disabled = false;
            
            if (result.error) {
                showAlert(`导出失败: ${result.error}`, '导出错误');
                return;
            }
            
            if (result.success && result.file_path) {
                // 使用display_path来显示更简短的路径
                const displayPath = result.display_path || result.file_path;
                
                // 创建导出成功对话框
                const modal = document.createElement('div');
                modal.className = 'modal fade';
                modal.id = 'export-success-modal';
                modal.setAttribute('tabindex', '-1');
                modal.setAttribute('aria-hidden', 'true');
                
                modal.innerHTML = `
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">导出成功</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <p>数据已成功导出到:</p>
                                <div class="export-path-container">
                                    <code>${displayPath}</code>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-primary" id="open-export-folder">打开文件夹</button>
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                // 添加样式
                const style = document.createElement('style');
                style.textContent = `
                    .export-path-container {
                        background-color: #f8f9fa;
                        padding: 10px;
                        border-radius: 4px;
                        word-break: break-all;
                        max-width: 100%;
                        overflow-x: auto;
                    }
                `;
                document.head.appendChild(style);
                
                // 显示模态框
                const bsModal = new bootstrap.Modal(modal);
                bsModal.show();
                
                // 添加打开文件夹按钮事件
                document.getElementById('open-export-folder').addEventListener('click', function() {
                    try {
                        const dirPath = result.file_path.substring(0, result.file_path.lastIndexOf('\\'));
                        window.pywebview.api.open_file_explorer(dirPath)
                            .catch(error => console.error('无法打开文件目录:', error));
                    } catch (e) {
                        console.error('处理文件路径时出错:', e);
                    }
                    bsModal.hide();
                });
                
                // 监听模态框关闭事件，移除DOM元素
                modal.addEventListener('hidden.bs.modal', function() {
                    document.body.removeChild(modal);
                });
            } else {
                showAlert('导出过程中发生未知错误', '导出错误');
            }
        })
        .catch(error => {
            // 恢复按钮状态
            exportBtn.innerHTML = originalText;
            exportBtn.disabled = false;
            
            handleApiError(error);
        });
}

// 辅助函数：更新支付统计UI
function updatePaymentStatsUI(filteredPayments) {
    const totalAmountElement = document.getElementById('total-amount');
    const paymentCountElement = document.getElementById('payment-count');
    
    if (!totalAmountElement || !paymentCountElement) return;
    
    // 计算总金额和数量
    const totalAmount = filteredPayments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    const paymentCount = filteredPayments.length;
    
    // 更新界面
    const formattedAmount = `¥${totalAmount.toFixed(2)}`;
    totalAmountElement.textContent = formattedAmount;
    paymentCountElement.textContent = paymentCount;
    
    // 设置data-length属性以便CSS能够根据数字长度自动调整字体大小
    totalAmountElement.setAttribute('data-length', formattedAmount.length);
    paymentCountElement.setAttribute('data-length', paymentCount.toString().length);
    
    // 获取当前选中的周期
    const periodFilter = document.getElementById('payment-period-filter')?.value || 'all';
    
    // 更新图表
    updatePaymentsChart(filteredPayments, periodFilter);
}

// 初始化主题
function initTheme() {
    // 从localStorage获取主题设置
    const savedTheme = localStorage.getItem('ppms-theme');
    if (savedTheme) {
        currentTheme = savedTheme;
    }
    
    // 应用主题
    document.body.setAttribute('data-theme', currentTheme);
    
    // 更新主题图标
    updateThemeIcons();
}

// 初始化主题切换开关
function initThemeSwitch() {
    const themeSwitch = document.getElementById('theme-switch');
    const themeIcon = document.querySelector('.theme-icon');
    
    if (themeSwitch) {
        // 设置初始状态
        if (currentTheme === 'dark') {
            themeIcon.textContent = '🌙';
        } else {
            themeIcon.textContent = '☀️';
        }
        
        // 添加事件监听
        themeSwitch.addEventListener('click', function() {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.body.setAttribute('data-theme', currentTheme);
            
            // 更新图标
            if (currentTheme === 'dark') {
                themeIcon.textContent = '🌙';
            } else {
                themeIcon.textContent = '☀️';
            }
            
            // 保存主题设置
            localStorage.setItem('ppms-theme', currentTheme);
            
            // 更新后端设置
            try {
                window.pywebview.api.update_settings({ theme: currentTheme })
                    .then(result => {
                        console.log('Theme updated:', result);
                    })
                    .catch(error => {
                        console.error('Error updating theme:', error);
                    });
            } catch (e) {
                console.log('Running in browser mode, skipping backend update');
            }
        });
    }
}

// 更新主题图标
function updateThemeIcons() {
    console.log('更新主题图标...');
    
    // 更新顶部导航栏的主题图标
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
    }
    
    // 更新设置页面的主题开关
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) {
        themeSwitch.checked = currentTheme === 'dark';
    }
    
    // 更新所有使用主题图标的元素
    const lightIcons = document.querySelectorAll('.theme-icon-light');
    const darkIcons = document.querySelectorAll('.theme-icon-dark');
    
    if (currentTheme === 'dark') {
        lightIcons.forEach(icon => icon.style.display = 'none');
        darkIcons.forEach(icon => icon.style.display = 'inline-block');
    } else {
        lightIcons.forEach(icon => icon.style.display = 'inline-block');
        darkIcons.forEach(icon => icon.style.display = 'none');
    }
}

// 主题切换函数
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', currentTheme);
    
    // 更新主题图标
    updateThemeIcons();
    
    // 更新设置页面的主题开关
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) {
        themeSwitch.checked = currentTheme === 'dark';
    }
    
    // 保存主题设置
    localStorage.setItem('ppms-theme', currentTheme);
    
    console.log('主题已切换为:', currentTheme);
}

// 加载设置
function loadSettings() {
    try {
        window.pywebview.api.get_settings()
            .then(settings => {
                console.log('加载设置:', settings);
                
                // 应用主题
                currentTheme = settings.theme || 'light';
                document.body.setAttribute('data-theme', currentTheme);
                console.log('应用主题设置:', currentTheme);
                
                // 更新主题图标
                updateThemeIcons();
                
                // 同步通用设置开关
                const autostartSwitch = document.getElementById('autostart-switch');
                if (autostartSwitch) {
                    autostartSwitch.checked = !!settings.autostart;
                }
                const minimizeToTraySwitch = document.getElementById('minimize-to-tray-switch');
                if (minimizeToTraySwitch) {
                    minimizeToTraySwitch.checked = !!settings.minimize_to_tray;
                }
            })
            .catch(error => {
                console.error('加载设置失败:', error);
            });
    } catch (e) {
        console.log('Running in browser mode, using default settings');
    }
}

// 设置当前日期
function updateCurrentDate() {
    if (currentDateElement) {
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        currentDateElement.textContent = now.toLocaleDateString('zh-CN', options);
    }
}

// 切换侧边栏
function toggleSidebar() {
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
        document.querySelector('.content').classList.toggle('expanded');
    }
}

// 导航到指定页面
function navigateTo(page) {
    console.log(`正在导航到页面: ${page}`);
    
    try {
        // 更新页面标题
        if (pageTitle) {
            pageTitle.textContent = getPageTitle(page);
        } else {
            console.warn('页面标题元素不存在');
        }
        
        // 更新导航项激活状态
        if (navItems) {
            navItems.forEach(item => {
                if (item.getAttribute('data-page') === page) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        } else {
            console.warn('导航项元素不存在');
        }
        
        // 获取所有页面内容元素
        const pageContentsElements = document.querySelectorAll('.page-content');
        
        // 显示对应的页面内容
        if (pageContentsElements && pageContentsElements.length > 0) {
            pageContentsElements.forEach(content => {
                if (content.id === `${page}-page`) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        } else {
            console.warn('页面内容元素不存在');
        }
        
        // 保存当前页面
        localStorage.setItem('ppms-current-page', page);
        
        // 特殊页面处理
        if (page === 'reports') {
            setupCharts();
        }
        
        // 根据页面类型初始化不同页面
        switch (page) {
            case 'tasks':
                initTasksPage();
                break;
            case 'accounts':
                initAccountsPage();
                break;
            case 'projects':
                initProjectsPage();
                break;
            case 'payments':
                initPaymentsPage();
                break;
            case 'reports':
                initReportsPage();
                break;
            case 'settings':
                // 设置页面不需要特殊初始化
                break;
            default:
                console.warn(`未知页面类型: ${page}`);
        }
    } catch (error) {
        console.error('导航过程中发生错误:', error);
    }
}

// 添加API可用性检查函数
function checkApiAvailable() {
    return window.pywebview && window.pywebview.api;
}

// 安全调用API函数的包装器
function safeApiCall(apiFunction, ...args) {
    return new Promise((resolve, reject) => {
        // 检查API是否可用
        if (!window.pywebview || !window.pywebview.api) {
            console.error('PyWebView API 不可用');
            reject(new Error('PyWebView API 不可用'));
            return;
        }
        
        // 直接使用window.pywebview.api调用，不做函数检查
        try {
            window.pywebview.api[apiFunction](...args)
                .then(result => {
                    resolve(result);
                })
                .catch(error => {
                    console.error(`API调用失败: ${apiFunction}`, error);
                    reject(error);
                });
        } catch (error) {
            console.error(`API调用异常: ${apiFunction}`, error);
            reject(error);
        }
    });
}

// 修改loadTasksData函数
function loadTasksData(autoTransferToProjects = false) {
    console.log('尝试加载任务数据...');
    
    safeApiCall('get_tasks')
        .then(tasks => {
            console.log('All tasks loaded:', tasks.length);
            
            // 过滤掉已删除的任务和已完成的任务(已完成任务将在项目模块中显示)
            tasksList = tasks.filter(task => {
                const isDeleted = task.is_deleted === true || task.status === 'deleted';
                const isCompleted = task.status === 'completed';
                return !isDeleted && !isCompleted;
            });
            
            // 更新任务状态：有进度记录的任务标记为"进行中"，没有进度记录的任务标记为"待办"
            tasksList.forEach(task => {
                // 已完成的任务不需要处理
                if (task.status === 'completed') {
                    return;
                }
                
                // 检查是否有进度记录
                safeApiCall('get_task_progress', task.id)
                    .then(progress => {
                        // 如果有进度记录但状态不是"进行中"，更新状态
                        if (progress && progress.length > 0 && task.status !== 'in-progress') {
                            safeApiCall('update_task', task.id, {
                                status: 'in-progress'
                            }).then(() => {
                                console.log(`任务 "${task.title}" 状态已更新为进行中`);
                                task.status = 'in-progress';
                                // 更新任务状态徽章
                                updateTaskStatusBadge();
                            }).catch(error => {
                                console.error('更新任务状态失败:', error);
                            });
                        } 
                        // 如果没有进度记录但状态不是"待办"，更新状态
                        else if ((!progress || progress.length === 0) && task.status !== 'pending') {
                            safeApiCall('update_task', task.id, {
                                status: 'pending'
                            }).then(() => {
                                console.log(`任务 "${task.title}" 状态已更新为待办`);
                                task.status = 'pending';
                                // 更新任务状态徽章
                                updateTaskStatusBadge();
                            }).catch(error => {
                                console.error('更新任务状态失败:', error);
                            });
                        }
                    })
                    .catch(error => {
                        console.error('获取任务进度失败:', error);
                    });
            });
            
            console.log('Tasks after filtering:', tasksList.length);
            renderTasksList(tasksList);
            updateTaskStatusBadge();
            
            // 加载客户和任务类别选项列表
            loadClientsFromDatabase();
            loadCategoriesFromDatabase();
            
            // 仅当需要时，将已完成的任务转移到项目模块
            if (autoTransferToProjects) {
                const completedTasks = tasks.filter(task => {
                    const isDeleted = task.is_deleted === true || task.status === 'deleted';
                    return !isDeleted && task.status === 'completed';
                });
                
                if (completedTasks.length > 0) {
                    console.log('Completed tasks to add to projects:', completedTasks.length);
                    transferCompletedTasksToProjects(completedTasks);
                }
            }
        })
        .catch(error => {
            console.error('加载任务数据失败:', error);
            showAlert('加载任务数据失败，请重启应用', '错误');
            // 显示空状态
            const tasksListElement = document.getElementById('tasks-list');
            if (tasksListElement) {
                tasksListElement.innerHTML = `
                    <div class="empty-state">
                        <p><i class="bi bi-exclamation-triangle"></i> 加载失败，请重启应用</p>
                    </div>
                `;
            }
        });
}

// 修改loadWebsitesData函数
function loadWebsitesData() {
    console.log('尝试加载网站类型数据...');
    
    safeApiCall('get_websites')
        .then(websites => {
            console.log('网站类型列表已加载:', websites.length);
            // 保存完整的网站对象数组，而不只是名称
            websitesList = websites;
            updateWebsiteDatalist();
        })
        .catch(error => {
            console.error('获取网站类型列表失败:', error);
            // 使用空数组初始化
            websitesList = [];
            updateWebsiteDatalist();
        });
}

// 修改loadAccountsData函数
function loadAccountsData() {
    console.log('尝试加载账号数据...');
    
    // 加载网站类型列表
    loadWebsitesData();
    
    // 清空搜索框
    const searchInput = document.getElementById('account-search');
    if (searchInput) {
        searchInput.value = '';
    }
    
    safeApiCall('get_accounts')
        .then(accounts => {
            console.log("原始账号数据:", accounts);
            
            // 修复数据：检测并修复可能错位的数据
            const fixedAccounts = accounts.map(account => {
                const fixed = {...account};
                
                // 检测账号字段是否包含日期格式，如果是则可能是错位的
                if (fixed.account && 
                    (fixed.account.includes('-') || 
                     fixed.account.match(/^\d{4}-\d{2}-\d{2}/))) {
                    console.log(`检测到账号字段可能错位: ${fixed.account}`);
                    
                    // 如果row字段看起来像账号，而account字段看起来像日期，则交换它们
                    if (fixed.row && !fixed.row.includes('-') && !fixed.row.match(/^\d{4}-\d{2}-\d{2}/)) {
                        console.log(`修复错位: 交换account和row字段的值`);
                        console.log(`修复前: account=${fixed.account}, row=${fixed.row}`);
                        
                        const temp = fixed.account;
                        fixed.account = fixed.row;
                        fixed.row = temp;
                        
                        console.log(`修复后: account=${fixed.account}, row=${fixed.row}`);
                    } else {
                        // 如果row字段不像账号，直接清空account
                        console.log(`无法找到有效的账号值，清空account字段`);
                        fixed.account = '';
                    }
                }
                
                // 清理可能的空值或无效值
                if (fixed.row === 'null' || fixed.row === 'undefined' || fixed.row === null) {
                    fixed.row = '';
                }
                
                if (fixed.account === 'null' || fixed.account === 'undefined' || fixed.account === null) {
                    fixed.account = '';
                }
                
                return fixed;
            });
            
            console.log("修复后的账号数据:", fixedAccounts);
            accountsList = fixedAccounts;
            renderAccountsList(fixedAccounts);
            
            // 更新标签筛选下拉框
            updateTagFilterOptions(fixedAccounts);
        })
        .catch(error => {
            console.error('加载账号数据失败:', error);
            showAlert('加载账号数据失败，请重启应用', '错误');
            // 显示空状态
            const accountsListElement = document.getElementById('accounts-list');
            if (accountsListElement) {
                accountsListElement.innerHTML = `
                    <div class="empty-state">
                        <p><i class="bi bi-exclamation-triangle"></i> 加载失败，请重启应用</p>
                    </div>
                `;
            }
        });
}

// 修改loadProjectsData函数
function loadProjectsData() {
    console.log('尝试加载项目数据...');
    
    safeApiCall('get_projects', showArchived)
        .then(projects => {
            projectsList = projects;
            renderProjectsList(projects);
            
            // 加载项目类型选项
            loadProjectTypeOptions(projects);
        })
        .catch(error => {
            console.error('加载项目数据失败:', error);
            showAlert('加载项目数据失败，请重启应用', '错误');
            // 显示空状态
            const projectsListElement = document.getElementById('projects-list');
            if (projectsListElement) {
                projectsListElement.innerHTML = `
                    <div class="empty-state">
                        <p><i class="bi bi-exclamation-triangle"></i> 加载失败，请重启应用</p>
                    </div>
                `;
            }
        });
}

// 修改loadPaymentsData函数
function loadPaymentsData() {
    console.log('尝试加载结算数据...');
    
    // 清空现有数据，防止重复
    paymentsList = [];
    
    const currentYear = new Date().getFullYear().toString();
    const periodFilter = document.getElementById('payment-period-filter')?.value || currentYear;
    
    safeApiCall('get_payments')
        .then(payments => {
            console.log('获取到结算数据:', payments.length);
            
            // 数据去重：按照ID进行去重
            const uniquePayments = [];
            const seenIds = new Set();
            
            payments.forEach(payment => {
                if (!seenIds.has(payment.id)) {
                    seenIds.add(payment.id);
                    uniquePayments.push(payment);
                } else {
                    console.warn(`发现重复的结算记录ID: ${payment.id}`);
                }
            });
            
            console.log(`原始结算数据: ${payments.length}条，去重后: ${uniquePayments.length}条`);
            
            // 保存到全局变量
            paymentsList = uniquePayments;
            
            // 更新年份筛选选项
            updatePaymentYearOptions(uniquePayments);
            
            // 渲染结算列表
            renderPaymentsList(uniquePayments);
            
            // 更新收入统计
            updatePaymentStatistics(uniquePayments, periodFilter);
        })
        .catch(error => {
            console.error('加载结算数据失败:', error);
            showAlert('加载结算数据失败，请重启应用', '错误');
            // 显示空状态
            const paymentsListElement = document.getElementById('payments-list');
            if (paymentsListElement) {
                paymentsListElement.innerHTML = `
                    <div class="empty-state">
                        <p><i class="bi bi-exclamation-triangle"></i> 加载失败，请重启应用</p>
                    </div>
                `;
            }
        });
}

// 修改setupTaskReportCharts函数
function setupTaskReportCharts(period) {
    console.log('尝试设置任务报告图表...');
    
    // 显示加载状态
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        container.classList.add('loading');
    });
    
    // 获取所有任务数据
    safeApiCall('get_tasks')
        .then(tasks => {
            // 获取所有项目数据（包括已归档和未归档的）
            safeApiCall('get_projects', true)
                .then(archivedProjects => {
                    safeApiCall('get_projects', false)
                        .then(activeProjects => {
                            // 合并所有项目
                            const allProjects = [...activeProjects];
                            archivedProjects.forEach(archivedProject => {
                                if (!allProjects.some(p => p.id === archivedProject.id)) {
                                    allProjects.push(archivedProject);
                                }
                            });
                            
                            console.log('报告 - 获取到未归档项目:', activeProjects.length);
                            console.log('报告 - 获取到归档项目:', archivedProjects.length);
                            console.log('报告 - 合并后总项目数:', allProjects.length);
                            
                            // 调用各个图表函数并传递任务和所有项目数据
                            updateTasksStatistics(tasks, allProjects, period);
                            createTaskStatusChart(tasks, allProjects, period);
                            createTaskTypeDistributionChart(allProjects, period);
                            createTaskTrendChart(tasks, allProjects, period);
                            
                            // 移除加载状态
                            chartContainers.forEach(container => {
                                container.classList.remove('loading');
                            });
                        })
                        .catch(error => {
                            console.error('获取未归档项目数据失败:', error);
                            // 移除加载状态
                            chartContainers.forEach(container => {
                                container.classList.remove('loading');
                                container.innerHTML = '<div class="chart-error"><i class="bi bi-exclamation-triangle"></i> 加载失败</div>';
                            });
                        });
                })
                .catch(error => {
                    console.error('获取归档项目数据失败:', error);
                    // 移除加载状态
                    chartContainers.forEach(container => {
                        container.classList.remove('loading');
                        container.innerHTML = '<div class="chart-error"><i class="bi bi-exclamation-triangle"></i> 加载失败</div>';
                    });
                });
        })
        .catch(error => {
            console.error('获取任务数据失败:', error);
            // 移除加载状态
            chartContainers.forEach(container => {
                container.classList.remove('loading');
                container.innerHTML = '<div class="chart-error"><i class="bi bi-exclamation-triangle"></i> 加载失败</div>';
            });
        });
}

// 获取页面标题
function getPageTitle(page) {
    switch (page) {
        case 'tasks':
            return '任务管理';
        case 'accounts':
            return '账号管理';
        case 'projects':
            return '项目管理';
        case 'payments':
            return '结算清单';
        case 'reports':
            return '数据报告';
        case 'settings':
            return '系统设置';
        default:
            return '任务管理系统';
    }
}

// 初始化任务页面
function initTasksPage() {
    console.log('初始化任务页面');
    // 加载任务数据
    loadTasksData();
}

// 初始化账号页面
function initAccountsPage() {
    console.log('初始化账号页面');
    // 加载账号数据
    loadAccountsData();
}

// 初始化项目页面
function initProjectsPage() {
    console.log('初始化项目页面');
    // 加载项目数据
    loadProjectsData();
}

// 初始化结算页面
function initPaymentsPage() {
    console.log('初始化结算页面');
    // 加载结算数据
    loadPaymentsData();
}

// 初始化报告页面
function initReportsPage() {
    console.log('初始化报告页面');
    // 设置默认报告周期
    setupTaskReportCharts('week');
}

// 初始化侧边栏
function initSidebar() {
    console.log('初始化侧边栏...');
    // 侧边栏切换按钮点击事件
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    // 检查本地存储中的侧边栏状态
    const sidebarCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    if (sidebarCollapsed && sidebar) {
        sidebar.classList.add('collapsed');
        document.body.classList.add('sidebar-collapsed');
    }
    // 侧边栏菜单项点击事件
    const sidebarItems = document.querySelectorAll('.sidebar-menu .nav-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            const pageName = this.getAttribute('data-page');
            if (pageName) {
                navigateTo(pageName);
            }
        });
    });
    // 初始化用户资料设置
    setupProfileSettings();
}

// 初始化导航
function initNavigation() {
    console.log('初始化导航...');
    
    // 为每个导航项添加点击事件
    if (navItems) {
        navItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const page = this.getAttribute('data-page');
                if (page) {
                    navigateTo(page);
                }
            });
        });
    }
    
    // 监听哈希变化
    window.addEventListener('hashchange', function() {
        const page = window.location.hash.substring(1) || 'tasks';
        navigateTo(page);
    });
}

// 切换侧边栏
function toggleSidebar() {
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
        document.body.classList.toggle('sidebar-collapsed');
        
        // 保存侧边栏状态到本地存储
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebar-collapsed', isCollapsed);
    }
}

// 显示错误通知
function showErrorNotification(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger fixed-top m-3';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        <strong>系统错误</strong>: ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(alertDiv);
}

// 处理头像上传和用户名设置
function setupProfileSettings() {
    // 获取头像和用户名的存储值
    loadUserProfile();
    
    // 头像上传处理
    const avatarInput = document.getElementById('avatar-input');
    if (avatarInput) {
        avatarInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            // 检查文件类型
            if (!file.type.match('image.*')) {
                showAlert('请选择图片文件', '格式错误');
                return;
            }
            
            // 检查文件大小 (限制为2MB)
            if (file.size > 2 * 1024 * 1024) {
                showAlert('图片大小不能超过2MB', '文件过大');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                // 更新预览
                const avatarPreview = document.getElementById('avatar-preview');
                const userAvatar = document.getElementById('user-avatar');
                
                if (avatarPreview) avatarPreview.src = e.target.result;
                if (userAvatar) userAvatar.src = e.target.result;
                
                // 保存到本地存储
                localStorage.setItem('userAvatar', e.target.result);
                
                // 如果有API可用，也保存到后端
                if (window.pywebview && window.pywebview.api) {
                    window.pywebview.api.update_settings({
                        userAvatar: e.target.result
                    }).then(() => {
                        console.log('头像已保存到后端');
                        loadUserProfile(); // 新增：保存后同步刷新侧边栏
                    }).catch(error => {
                        console.error('保存头像失败:', error);
                    });
                }
            };
            reader.readAsDataURL(file);
        });
    }
    
    // 用户名保存处理
    const saveUsernameBtn = document.getElementById('save-username-btn');
    if (saveUsernameBtn) {
        saveUsernameBtn.addEventListener('click', function() {
            const usernameInput = document.getElementById('username-input');
            if (!usernameInput || !usernameInput.value.trim()) {
                showAlert('请输入有效的用户名', '输入错误');
                return;
            }
            
            const username = usernameInput.value.trim();
            
            // 更新显示
            const usernameDisplay = document.getElementById('username-display');
            if (usernameDisplay) usernameDisplay.textContent = username;
            
            // 保存到本地存储
            localStorage.setItem('username', username);
            
            // 如果有API可用，也保存到后端
            if (window.pywebview && window.pywebview.api) {
                window.pywebview.api.update_settings({
                    username: username
                }).then(() => {
                    showAlert('用户名已保存', '成功');
                    console.log('用户名已保存到后端');
                    loadUserProfile(); // 新增：保存后同步刷新侧边栏
                }).catch(error => {
                    console.error('保存用户名失败:', error);
                    showAlert('保存用户名失败', '错误');
                });
            } else {
                showAlert('用户名已保存', '成功');
                loadUserProfile(); // 新增：本地保存也同步刷新
            }
        });
    }
    // 修复"选择图片"按钮无反应
    const selectAvatarBtn = document.getElementById('select-avatar-btn');
    if (selectAvatarBtn && avatarInput) {
        selectAvatarBtn.addEventListener('click', function() {
            avatarInput.click();
        });
    }
}

// 加载用户资料
function loadUserProfile() {
    // 尝试从API加载
    if (window.pywebview && window.pywebview.api && window.pywebview.api.get_settings) {
        window.pywebview.api.get_settings().then(settings => {
            if (settings && settings.username) {
                // 更新侧边栏用户名
                const usernameDisplay = document.getElementById('username-display');
                if (usernameDisplay) usernameDisplay.textContent = settings.username;
                // 更新设置页用户名
                const usernameInput = document.getElementById('username-input');
                if (usernameInput) usernameInput.value = settings.username;
                // 同步到本地
                localStorage.setItem('username', settings.username);
            }
            if (settings && settings.userAvatar) {
                // 更新侧边栏头像
                const userAvatar = document.getElementById('user-avatar');
                if (userAvatar) userAvatar.src = settings.userAvatar;
                // 更新设置页头像
                const avatarPreview = document.getElementById('avatar-preview');
                if (avatarPreview) avatarPreview.src = settings.userAvatar;
                // 同步到本地
                localStorage.setItem('userAvatar', settings.userAvatar);
            }
        }).catch(error => {
            // 如果API失败，尝试从本地加载
            loadUserProfileFromLocalStorage();
        });
    } else {
        // 如果API不可用，从本地存储加载
        loadUserProfileFromLocalStorage();
    }
}

// 从本地存储加载用户资料
function loadUserProfileFromLocalStorage() {
    // 加载用户名
    const username = localStorage.getItem('username');
    if (username) {
        const usernameDisplay = document.getElementById('username-display');
        const usernameInput = document.getElementById('username-input');
        if (usernameDisplay) usernameDisplay.textContent = username;
        if (usernameInput) usernameInput.value = username;
    }
    
    // 加载头像
    const userAvatar = localStorage.getItem('userAvatar');
    if (userAvatar) {
        const avatarPreview = document.getElementById('avatar-preview');
        const userAvatarImg = document.getElementById('user-avatar');
        if (avatarPreview) avatarPreview.src = userAvatar;
        if (userAvatarImg) userAvatarImg.src = userAvatar;
    }
}

// 安全加载用户资料，确保DOM和API都ready后再刷新侧边栏
function safeLoadUserProfile() {
    if (
        document.getElementById('user-avatar') &&
        document.getElementById('username-display') &&
        window.pywebview && window.pywebview.api && window.pywebview.api.get_settings
    ) {
        loadUserProfile();
    } else {
        setTimeout(safeLoadUserProfile, 100); // 100ms后重试
    }
}

window.addEventListener('pywebviewready', safeLoadUserProfile);
document.addEventListener('DOMContentLoaded', safeLoadUserProfile);

// 头像恢复默认按钮事件
const resetAvatarBtn = document.getElementById('reset-avatar-btn');
if (resetAvatarBtn) {
    resetAvatarBtn.addEventListener('click', function() {
        // 恢复为默认头像
        const defaultAvatar = 'img/default-avatar.png';
        const userAvatar = document.getElementById('user-avatar');
        const avatarPreview = document.getElementById('avatar-preview');
        if (userAvatar) userAvatar.src = defaultAvatar;
        if (avatarPreview) avatarPreview.src = defaultAvatar;
        // 清除本地存储
        localStorage.removeItem('userAvatar');
        // 如果有API，更新后端设置
        if (window.pywebview && window.pywebview.api && window.pywebview.api.update_settings) {
            window.pywebview.api.update_settings({ userAvatar: null }).then(() => {
                showAlert('头像已恢复为默认头像', '成功');
            }).catch(() => {
                showAlert('头像恢复失败', '错误');
            });
        } else {
            showAlert('头像已恢复为默认头像', '成功');
        }
    });
}