const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')

const baseUrl = 'https://top.baidu.com'
const targetUrl = 'https://top.baidu.com/board?platform=pc&sa=pcindex_a_right' // 百度热门地址

function getBaiduHotListByHTML(target_url, containerEle) {
  return new Promise((resolve, reject) => {

    axios.get(target_url)
      .then(res => {
        let hotList = []
        const html = res.data
        const $ = cheerio.load(html)
        $(containerEle).each((index, element) => {
          const ranktop = $(element).find('.index_k2hIU').text()
          const link = $(element).attr("href")
          const text = $(element).find(".normal_1fQqB .index_k2hIU > div").text()
          const hotValue = $(element).find(".content-wrap_1RisM .c-single-text-ellipsis").text()
          const img = $(element).find("img").attr("src")
            ? $(element).find("img").attr("src")
            : "";

          hotList.push({
            index,
            ranktop,
            link,
            text,
            hotValue,
            img,
          })
        })

        // console.log(hotList)

        resolve(hotList)
      })
      .catch(err => {
        console.error(err)
        reject(err)
      })

  })
}

async function createJSONFile() {
  const data = await getBaiduHotListByHTML(targetUrl, '.theme-hot[theme="realtime"] .list_1EDla a')

  // const filePath = `${__dirname}/baidu_realtime_hot.json` // 直接在本目录下创建
  const filePath = path.join(__dirname, '..', '/static', '/baidu_realtime_hot.json') // static下创建

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

createJSONFile().then(r => console.log('爬取百度热搜成功！'))
