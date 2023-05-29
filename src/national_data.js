const axios = require('axios')
const xlsx = require('node-xlsx').default
const fs = require('fs')
const path = require('path')

const TARGET_URL = 'https://data.stats.gov.cn/easyquery.htm?m=QueryData&dbcode=hgjd&rowcode=zb&colcode=sj&wds=%5B%5D&dfwds=%5B%7B%22wdcode%22%3A%22zb%22%2C%22valuecode%22%3A%22A0106%22%7D%5D' // 国家统计局

// 处理 Error: self signed certificate in certificate chain 错误
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

function getNationalData() {
  return new Promise((resolve, reject) => {
    axios.get(TARGET_URL)
      .then(r => {
        // console.log(r.data)
        resolve(r.data.returndata)
      })
      .catch(e => {
        console.error(e)
        reject(e)
      })
  })
}

// 获取三次产业贡献率数据
async function getContributionData() {
  // const params = {
  //   m: 'QueryData',
  //   dbcode: 'hgjd',
  //   rowcode: 'zb',
  //   colcode: 'sj',
  //   wds: encodeURI([]),
  //   dfwds: encodeURI([{"wdcode":"zb","valuecode":"A0106"}])
  // }
  try {
    const { datanodes, wdnodes } = await getNationalData() // datanodes数据,wdnodes表格头与第一列
    createXlsxFile(datanodes, wdnodes)
  } catch (e) {
    console.error(e)
  }
}

function createXlsxFile(data, payload) {
  // excel头部名称设置
  const fileSheetHead = [payload[1].wdname].concat(payload[1].nodes.map(item => item.cname))

  // 列宽设置
  const sheetOptions = {
    '!cols': [
      {wch: 24},
      {wch: 14},
      {wch: 14},
      {wch: 14},
      {wch: 14},
      {wch: 14},
      {wch: 14},
    ]
  }

  // 对数据body处理, nodes-xlsx 需要二维数组数据
  // 生成 [[fileSheetHead], [fileSheetBody]] 格式
  // fileSheetBody: [[str, str, str], [str, str, str], [str, str, str]]
  let fileSheetBody = []

  payload[0].nodes.forEach(node => {
    let curNode = []
    curNode.push(`${node.cname} ${node.unit}`)
    data.forEach(item => {
      if (node.code === item.wds[0].valuecode) {
        curNode.push(item.data.strdata)
      }
    })
    fileSheetBody.push(curNode)
  })

  const result = [fileSheetHead].concat(fileSheetBody)

  // console.log(result)

  const FILE_BUFFER = xlsx.build(
    [{ name: '国家统计局-国民经济核算', data: result }],
    { sheetOptions }
  )

  const filePath = path.join(__dirname, '..', '/static', '/national_contribution_rate.xlsx') // static下创建

  fs.writeFileSync(filePath, FILE_BUFFER, 'binary')
}

getContributionData().then(r => {
  console.log('爬取 国家统计局三次产业贡献率数据 成功!')
})
