const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')

const baseUrl = 'https://s.weibo.com'
const targetUrl = 'https://s.weibo.com/top/summary?cate=realtimehot' // 微博热门地址

const headers = {
  'Accept':
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Sec-Fetch-Dest': 'document',
  'Upgrade-Insecure-Requests': 1,
  'Cookie':
    'PC_TOKEN=6271925e07; SUB=_2AkMTN5Irf8NxqwFRmP0QzG7jZIh-zA_EieKla2PwJRMxHRl-yT9yqhUttRB6OLe8xLPQCEBhf5tAnSnNfVDn9ckjMlyY; SUBP=0033WrSXqPxfM72-Ws9jqgMF55529P9D9WhaEHQ47PRyh7_If0Fj6YaU; login_sid_t=3ca230c0ee70bf6ca38363da38d0079e; cross_origin_proto=SSL; _s_tentry=passport.weibo.com; Apache=5393742921305.052.1684741406784; SINAGLOBAL=5393742921305.052.1684741406784; ULV=1684741406789:1:1:1:5393742921305.052.1684741406784:',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
}

function getWeiboHotListByHTML(target_url, containerEle) {
  return new Promise((resolve, reject) => {

    axios.get(target_url, { headers })
      .then(res => {
        let hotList = []
        const html = res.data
        const $ = cheerio.load(html)
        $(containerEle).each((index, element) => {
          const ranktop = $(element).find('.ranktop').text()
          const link = baseUrl + $(element).find("a").attr("href")
          const text = $(element).find("a").text()
          const hotValue = $(element).find("span").text()
          const icon = $(element).find("img").attr("src")
            ? "https:" + $(element).find("img").attr("src")
            : "";

          hotList.push({
            index,
            ranktop,
            link,
            text,
            hotValue,
            icon,
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
  const data = await getWeiboHotListByHTML(targetUrl, '#pl_top_realtimehot table tbody tr')

  // const filePath = `${__dirname}/weibo_realtime_hot.json` // 直接在本目录下创建
  const filePath = path.join(__dirname, '..', '/static', '/weibo_realtime_hot.json') // static下创建

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

createJSONFile().then(r => console.log('爬取微博热搜成功！'))
