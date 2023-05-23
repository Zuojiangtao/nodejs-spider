const axios = require('axios')
const xlsx = require('node-xlsx').default
const fs = require('fs')
const path = require('path')

// const allFundList = 'http://fund.eastmoney.com/js/fundcode_search.js' // 获取所有基金数据 {代码，名称，类型，拼音}

// 定义常量
const TARGET_URL = 'http://fund.eastmoney.com/data/FundGuideapi.aspx' // 基金筛选接口地址
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
}

// 定义变量
let resultList = [] // 获取结果存储
let total = 0 // 筛选结果总数
let current = 1 // 当前页面

/**
 * 基金规模规则： 今年前50，资金规模不超过10亿
 * @param rs {string} 业绩
 * @param rt {string} 评级 [上证-sz， 招商-zs， ja-济安][不限，...一到五星]
 * @param se {string} 基金规模
 * @param nx {string} 成立年限
 * */
const params = {
  dt: '4',
  sd: '', // start time 开始时间
  ed: '', // end time 截至时间
  rs: 'jn,50', // *业绩 - 今年前50名
  rt: '', // *评级 - 'sz,5'代表 '上证,5星'
  se: '10', // *scale 基金规模不超过10亿
  nx: '', // *成立年限
  sc: 'jn',
  st: 'desc',
  pi: current, // page index 页码
  pn: 20, // page number 每页显示数量
  zf: 'diy',
  sh: 'list', // 数据形式
}

// 获取基金数据
function getFundList(params) {
  return new Promise((resolve, reject) => {
    axios.get(TARGET_URL, { headers, params })
      .then(res => {
        // 获取到的数据是 var rankData = { // ... } 的形式，需要额外处理成json格式
        const startIndex = res.data.indexOf('{')
        const resObj = JSON.parse(res.data?.substring(startIndex))

        total = resObj.datacount

        resolve(resObj.datas)
      })
      .catch(err => {
        console.error(err)
        reject(err)
      })
  })
}

// 创建xlsx文件
function createXlsxFile(data) {
  // excel头部名称设置
  const fileSheetHead = [
    '基金代码',
    '基金名称',
    '基金名称拼音缩写',
    '基金类型',
    '今年来',
    '近一周',
    '近一月',
    '近3月',
    '近6月',
    '近1年',
    '近2年',
    '近3年',
    '近5年',
    '',
    '是否可购买',
    '数据更新日期',
    '净值',
    '日增长率',
    '',
    '优惠后手续费',
    '购买起点',
    '',
    '手续费',
    '优惠后手续费',
    '成立来涨幅',
  ]
  // 列宽设置
  const sheetOptions = {
    '!cols': [
      {wch: 8},
      {wch: 30},
      {wch: 20},
      {wch: 14},
      {wch: 8},
      {wch: 8},
      {wch: 8},
      {wch: 8},
      {wch: 8},
      {wch: 8},
      {wch: 8},
      {wch: 8},
      {wch: 8},
      {wch: 8},
      {wch: 12},
      {wch: 14},
      {wch: 8},
      {wch: 8},
      {wch: 8},
      {wch: 8},
      {wch: 8},
      {wch: 8},
      {wch: 10},
      {wch: 10},
      {wch: 8},
      {wch: 8},
      {wch: 8},
      {wch: 14},
      {wch: 14},
    ]
  }
  // item为字符串  '001167,金鹰科技创新股票,JYKJCXGP,股票型,38.05,-0.85,1.50,17.79,29.49,50.42,46.76,118.66,130.74,,1,2023-05-22,1.6290,-1.39,1,0.15%,10,1,1.50%,0.15%,62.90'
  // 需要处理为[[string, string, string],[string, string, string],[string, string, string]]格式
  // https://github.com/mgcrea/node-xlsx
  const result = [fileSheetHead].concat(data.map(item => item.split(',')))

  const FILE_BUFFER = xlsx.build(
    [{ name: '天天基金Sheet', data: result }],
    { sheetOptions }
  )

  const filePath = path.join(__dirname, '..', '/static', '/tiantian_fund.xlsx') // static下创建

  fs.writeFileSync(filePath, FILE_BUFFER, 'binary')
}

// 获取数据列表
async function asyncGetAllFundList(params) {
  const res = await getFundList(params)
  resultList = [...resultList, ...res]
  if (resultList.length < total) {
    current++
    await asyncGetAllFundList(params)
  } else {
    createXlsxFile(resultList)
  }
}

asyncGetAllFundList(params).then(r => {
  console.log('爬取 天天基金数据 成功!')
})
