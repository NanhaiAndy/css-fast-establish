/**
 * 中文变量名 → 英文 camelCase 本地翻译
 * 逐字映射，每个中文字对应一个英文单词，拼接为驼峰
 */

// 常用编程语义中文字典：单个中文字 → 单个英文单词（无重复 key）
const DICT: Record<string, string> = {
  // 人物 / 身份
  '人': 'person', '户': 'account', '用': 'user', '我': 'self', '你': 'you',
  '他': 'other', '客': 'guest', '管': 'admin', '员': 'member',

  // 数据 / 值
  '名': 'name', '值': 'value', '量': 'amount', '数': 'count', '额': 'sum',
  '总': 'total', '均': 'avg', '余': 'rest', '差': 'diff', '积': 'product',
  '商': 'quotient', '比': 'ratio', '率': 'rate',

  // 集合 / 容器
  '列': 'list', '表': 'table', '组': 'group', '集': 'set', '项': 'item',
  '条': 'row', '个': 'unit', '批': 'batch', '堆': 'heap',
  '栈': 'stack', '队': 'queue',

  // 文档 / 内容
  '文': 'file', '件': 'component', '档': 'doc', '目': 'dir', '录': 'record',
  '内': 'content', '称': 'call', '容': 'body', '标': 'label', '题': 'topic', '副': 'sub',
  '头': 'header', '尾': 'footer', '正': 'main', '附': 'extra',

  // 文本 / 字符
  '字': 'word', '符': 'char', '串': 'string', '长': 'length', '短': 'short',
  '大': 'big', '小': 'small', '多': 'many', '少': 'few',

  // 类型 / 分类
  '类': 'type', '型': 'category', '种': 'kind', '级': 'level', '层': 'layer',
  '版': 'version', '本': 'edition',

  // 状态 / 描述
  '状': 'status', '态': 'state', '描': 'desc', '述': 'detail', '备': 'remark',
  '注': 'note', '释': 'comment', '信': 'info', '息': 'message', '说': 'say',
  '明': 'desc', '默': 'default', '认': 'confirm', '初': 'initial',

  // 颜色 / 外观
  '颜': 'color', '色': 'color', '红': 'red', '绿': 'green', '蓝': 'blue',
  '白': 'white', '黑': 'black', '黄': 'yellow', '灰': 'gray',
  '背': 'bg', '景': 'bg', '边': 'border', '框': 'frame', '圆': 'round',
  '角': 'corner', '阴': 'shadow', '影': 'shadow', '透': 'opacity',

  // 尺寸 / 位置
  '宽': 'width', '高': 'height', '深': 'depth', '厚': 'thick',
  '上': 'top', '下': 'bottom', '左': 'left', '右': 'right',
  '前': 'prev', '后': 'next', '中': 'mid', '心': 'center',
  '顶': 'top', '底': 'bottom', '外': 'outer', '距': 'gap', '偏': 'offset',

  // 时间 / 日期
  '时': 'time', '期': 'period', '年': 'year', '月': 'month', '日': 'day',
  '周': 'week', '昨': 'yesterday', '今': 'today', '早': 'morning',
  '晚': 'evening', '分': 'minute', '秒': 'second', '钟': 'clock',
  '历': 'calendar', '超': 'timeout', '延': 'delay', '过': 'expire',

  // 动作 - 增删改查
  '增': 'add', '删': 'delete', '除': 'remove', '改': 'update',
  '查': 'query', '找': 'find', '搜': 'search', '索': 'index',
  '加': 'plus', '减': 'minus', '乘': 'mul', '存': 'save',
  '储': 'store', '读': 'read', '写': 'write', '取': 'get',
  '设': 'set', '配': 'config', '置': 'setting',

  // 动作 - 网络 / 传输
  '发': 'send', '送': 'deliver', '收': 'receive', '接': 'accept',
  '传': 'transfer', '导': 'export', '入': 'input', '出': 'output',
  '载': 'load', '刷': 'refresh',

  // 动作 - UI 交互
  '显': 'show', '示': 'display', '隐': 'hidden', '藏': 'cache',
  '打': 'open', '关': 'close', '启': 'enable', '停': 'stop',
  '开': 'open', '选': 'select', '择': 'choose', '切': 'switch',
  '换': 'change', '点': 'click', '按': 'press', '拖': 'drag',
  '放': 'drop', '滚': 'scroll', '缩': 'scale',

  // 动作 - 流程
  '创': 'create', '建': 'build', '新': 'new', '旧': 'old',
  '复': 'copy', '制': 'clone', '编': 'encode', '解': 'decode',
  '转': 'convert', '变': 'change', '移': 'move', '动': 'move',
  '跳': 'jump', '回': 'back', '退': 'undo', '重': 'retry',
  '恢': 'restore', '还': 'return',

  // 动作 - 播放
  '播': 'play', '暂': 'pause', '续': 'resume',

  // 锁 / 绑定
  '锁': 'lock', '绑': 'bind', '定': 'fixed', '固': 'static',
  '限': 'limit', '控': 'control', '禁': 'disable',

  // 布尔 / 逻辑
  '是': 'is', '否': 'not', '有': 'has', '无': 'none', '空': 'empty',
  '真': 'true', '假': 'false', '全': 'all', '非': 'not',

  // 关系 / 结构
  '主': 'primary', '子': 'sub', '父': 'parent', '兄': 'sibling',
  '根': 'root', '首': 'first', '末': 'last',

  // 网络 / 服务
  '服': 'server', '务': 'service', '站': 'site', '网': 'net',
  '络': 'network', '链': 'link', '端': 'port',
  '址': 'host', '域': 'domain', '路': 'path', '径': 'route',
  '页': 'page', '口': 'port', '协': 'protocol', '议': 'protocol',

  // 安全 / 认证
  '安': 'safe', '权': 'auth', '登': 'login',
  '密': 'secret', '码': 'code', '验': 'verify', '证': 'token',
  '签': 'sign', '鉴': 'auth',

  // 逻辑 / 编程
  '规': 'rule', '则': 'rule', '判': 'judge',
  '断': 'check', '循': 'loop', '环': 'loop', '异': 'error',
  '常': 'exception', '错': 'fault', '误': 'mistake', '警': 'warn',
  '告': 'alert', '提': 'prompt', '试': 'try', '调': 'debug',
  '算': 'calc', '法': 'method', '公': 'formula', '式': 'formula',

  // 日志
  '志': 'log', '记': 'record',

  // 页面 / 展示
  '视': 'view', '图': 'image', '模': 'module', '块': 'block',
  '插': 'plugin', '扩': 'extend', '展': 'expand',

  // 等待 / 进度
  '等': 'wait', '待': 'pending', '进': 'progress', '程': 'process',

  // 缓存
  '缓': 'cache', '冲': 'buffer',

  // 测试
  '测': 'test',

  // 打印
  '印': 'print',

  // 百分比
  '百': 'percent',

  // 货币 / 价格
  '价': 'price', '钱': 'money', '费': 'fee', '薪': 'salary',
  '资': 'capital', '元': 'yuan',

  // 常用形容词
  '最': 'max', '低': 'low', '优': 'best', '劣': 'worse',

  // 页面元素
  '占': 'placeholder', '位': 'slot',
  '遮': 'mask', '罩': 'overlay', '弹': 'popup', '窗': 'dialog',
  '菜': 'menu', '栏': 'bar', '卡': 'card',
  '抽': 'drawer', '旗': 'flag',

  // 图片
  '片': 'pic', '像': 'avatar', '预': 'preview', '览': 'view',

  // 排序
  '排': 'sort', '序': 'order', '升': 'asc', '降': 'desc',

  // 地理 / 地址
  '地': 'address', '省': 'province', '市': 'city', '区': 'district',
  '镇': 'town', '村': 'village', '街': 'street', '楼': 'building',
  '室': 'room',

  // 手机 / 电话
  '电': 'phone', '话': 'tel', '邮': 'email', '箱': 'mail',

  // 步骤 / 流程
  '步': 'step', '段': 'phase', '节': 'section', '章': 'chapter',
  '篇': 'article',

  // 通用
  '原': 'raw', '生': 'raw', '静': 'static', '亮': 'light', '暗': 'dark',
  '辅': 'secondary', '负': 'negative',

  // 补充（未在上面出现的）
  '联': 'union', '系': 'relation', '帮': 'help', '助': 'help',
  '工': 'work', '具': 'tool', '盘': 'disk', '库': 'db',
  '源': 'source', '代': 'code', '面': 'face', '界': 'view',
  '幕': 'screen', '屏': 'screen', '轮': 'round', '圈': 'circle',
  '线': 'line', '专': 'expert', '业': 'biz',
  '品': 'product', '店': 'shop', '车': 'car', '房': 'house',
  '门': 'door', '钥': 'key',

  // 未知的变量名
  '结': 'knot', '构': 'construct', '样': 'shape', '订': 'order', '单': 'placement',
  '树': 'tree', '形': 'shape', '格': 'grid', '手': 'hand', '机': 'machine', '化': 'change',
  '猪': 'pig', '八': 'eight', '戒': 'abstainFrom', '摩': 'rub', '托': 'torr',

  // --- 以下为新增补充 ---

  // 运行 / 执行
  '运': 'run', '执': 'exec', '布': 'deploy', '部': 'deploy', '署': 'deploy',

  // 响应 / 请求
  '响': 'resp', '应': 'response', '请': 'req', '求': 'request',

  // 环境与配置
  '境': 'env', '依': 'depend', '赖': 'depend',

  // 数据处理
  '果': 'result', '报': 'report', '析': 'analyze', '合': 'merge',
  '拆': 'split', '拼': 'concat', '聚': 'gather', '匹': 'match',
  '滤': 'filter', '映': 'mapRef', '射': 'mapRef',

  // 对象 / 实例
  '实': 'real', '例': 'instance', '对': 'pair', '象': 'object',
  '封': 'encap', '装': 'pack',

  // 校验 / 约束
  '校': 'validate', '约': 'constraint', '束': 'bind', '允': 'allow',
  '许': 'permit', '拒': 'reject', '截': 'intercept', '授': 'grant',

  // 编程概念
  '引': 'import', '参': 'param', '赋': 'assign', '声': 'declare',
  '枚': 'enum', '泛': 'generic', '递': 'recurse', '迭': 'iterate',
  '归': 'regress', '适': 'adapt', '兼': 'compat', '略': 'strategy',
  '策': 'strategy', '粒': 'granular',

  // UI / 渲染
  '渲': 'render', '染': 'render', '绘': 'draw', '嵌': 'embed',
  '套': 'wrap', '悬': 'hover', '浮': 'float', '滑': 'smooth',
  '互': 'interact',

  // 状态 / 监控
  '监': 'watch', '观': 'observe', '察': 'inspect', '稳': 'stable',
  '紧': 'urgent', '急': 'urgent', '危': 'danger', '险': 'risk',
  '崩': 'crash', '溃': 'crash',

  // 通知 / 通信
  '通': 'pass', '知': 'notify', '醒': 'remind', '问': 'ask',
  '答': 'answer', '询': 'inquire',

  // 生命周期
  '更': 'update', '迁': 'migrate', '废': 'deprecate', '弃': 'abandon',
  '维': 'maintain', '护': 'protect', '次': 'turn', '卸': 'uninstall',
  '册': 'register',

  // 压缩 / 吞吐
  '压': 'compress', '吞': 'throughput', '熔': 'fuse',

  // 随机
  '随': 'random',

  // 离线
  '离': 'offline',

  // 购物 / 业务
  '购': 'buy', '物': 'goods', '付': 'pay', '折': 'discount',
  '惠': 'favor', '仓': 'warehouse',

  // 其他
  '准': 'ready', '自': 'auto', '局': 'local', '核': 'core',
  '探': 'probe', '途': 'useCase',
};

// 常用编程语义中文词组字典：2+ 字中文词组 → 英文单词
const WORD_DICT: Record<string, string> = {
  '用户': 'user', '用户名': 'username', '密码': 'password',
  '价格': 'price', '数据': 'data', '列表': 'list',
  '状态': 'status', '名称': 'name', '地址': 'address',
  '时间': 'time', '手机': 'phone', '邮箱': 'email',
  '图片': 'image', '颜色': 'color', '标签': 'tag',
  '类型': 'type', '标题': 'title', '内容': 'content',
  '配置': 'config', '搜索': 'search', '过滤': 'filter',
  '排序': 'sort', '删除': 'delete', '编辑': 'edit',
  '创建': 'create', '更新': 'update', '查询': 'query',
  '订单': 'order', '商品': 'product', '购物': 'shop',
  '支付': 'payment', '页面': 'page', '组件': 'component',
  '按钮': 'button', '输入': 'input', '输出': 'output',
  '结果': 'result', '错误': 'error', '警告': 'warning',
  '成功': 'success', '失败': 'failure', '加载': 'loading',
  '消息': 'message', '通知': 'notification', '登录': 'login',
  '注册': 'register', '权限': 'permission', '菜单': 'menu',
  '导航': 'navigation', '轮播': 'carousel', '弹窗': 'modal',
  '表格': 'table', '卡片': 'card', '头像': 'avatar',
  '搜索框': 'searchBox', '下拉': 'dropdown', '侧边栏': 'sidebar',
  '工具栏': 'toolbar', '状态栏': 'statusBar', '标题栏': 'titleBar',
  '占位': 'placeholder', '选项': 'option', '默认': 'defaultValue',
  '最大': 'max', '最小': 'min', '总数': 'totalCount',
  '当前': 'current', '选中': 'selected', '激活': 'active',
  '禁用': 'disabled', '隐藏': 'hidden', '可见': 'visible',
  '必填': 'required', '验证': 'validation', '格式': 'format',
  '文件': 'file', '文件夹': 'folder', '上传': 'upload',
  '下载': 'download', '预览': 'preview', '详情': 'detail',
  '描述': 'description', '备注': 'remark', '操作': 'action',
  '提交': 'submit', '取消': 'cancel', '确认': 'confirm',
  '保存': 'save', '重置': 'reset', '刷新': 'refresh',
  '开始': 'start', '结束': 'end', '暂停': 'pause',
  '继续': 'continue', '完成': 'complete', '返回': 'back',
  '首页': 'home', '上一页': 'prevPage', '下一页': 'nextPage',
  '规格': 'spec', '分类': 'category', '品牌': 'brand',
  '库存': 'stock', '折扣': 'discount', '运费': 'shipping',
  '测试': 'test', '商机': 'chance', '客户' : 'customer',
  '服务': 'service', '财务': 'finance', '账户': 'account',
  '发票': 'invoice', '物流': 'logistics', '售后': 'afterSale',
  '培训': 'training', '资源': 'resource', '任务': 'task',
  '项目': 'project', '纠纷': 'dispute', '活动': 'activity',
  '会议': 'meeting', '报告': 'report', '报告单': 'report',
  '保障': 'safeguard', '组织': 'organization', '部门': 'department',
  '团队': 'team', '角色': 'role', '人员': 'person',
  '权限管理': 'permissionManagement', '员工': 'member', '用户管理': 'userManagement',
  '权限控制': 'permissionControl', '案例': 'case', '客服': 'customerService',
  '技能': 'skill', '资质': 'qualification', '门店': 'store', '学习': 'study',
};

/**
 * 将中文字符串翻译为英文 camelCase 变量名
 * 翻译优先级：userDict → WORD_DICT → DICT（逐字）
 * 支持最长匹配：优先匹配更长的中文词组
 * 非中文字符保留原样
 */
export function translateChineseToEnglish(
  text: string,
  options?: { userDict?: Record<string, string>; blacklist?: Set<string> }
): string {
  // 黑名单检查：完整文本在黑名单中则直接返回原文
  if (options?.blacklist && options.blacklist.has(text)) {
    return text;
  }

  const userDict = options?.userDict;
  const words: string[] = [];
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    // 非中文字符处理
    if (!/[\u4e00-\u9fa5]/.test(char)) {
      if (/[a-zA-Z0-9_]/.test(char)) {
        // 英文/数字/下划线追加到最后一个词
        if (words.length > 0) {
          words[words.length - 1] += char;
        } else {
          words.push(char);
        }
      }
      i++;
      continue;
    }

    // 尝试最长匹配：从当前位置开始，查找 userDict 和 WORD_DICT 中最长的匹配
    let bestMatch = '';
    let bestTranslation = '';

    // 确定最大可能匹配长度
    const maxLen = text.length - i;

    // 先检查 userDict
    if (userDict) {
      for (let len = maxLen; len >= 1; len--) {
        const substr = text.substring(i, i + len);
        if (userDict[substr] !== undefined) {
          if (len > bestMatch.length) {
            bestMatch = substr;
            bestTranslation = userDict[substr];
          }
          break; // 最长匹配已找到
        }
      }
    }

    // 再检查 WORD_DICT（仅当 userDict 没有找到等长或更长的匹配时）
    for (let len = maxLen; len >= 1; len--) {
      if (len <= bestMatch.length) break; // 不可能比已匹配的更长
      const substr = text.substring(i, i + len);
      if (WORD_DICT[substr] !== undefined) {
        bestMatch = substr;
        bestTranslation = WORD_DICT[substr];
        break; // 最长匹配已找到
      }
    }

    if (bestMatch.length >= 2) {
      // 词组匹配成功
      words.push(bestTranslation);
      i += bestMatch.length;
    } else {
      // 回退到逐字 DICT 查找
      if (DICT[char]) {
        words.push(DICT[char]);
      } else {
        // 字典里没有的中文字保留
        words.push(char);
      }
      i++;
    }
  }

  if (words.length === 0) return text;

  // 拼接为 camelCase
  return words
    .map((w, idx) => {
      if (idx === 0) return w.toLowerCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join('');
}
