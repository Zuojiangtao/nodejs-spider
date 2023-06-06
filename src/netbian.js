const axios = require('axios')
const cheerio = require('cheerio')
const path = require('path')
const download = require('download')

const TARGET_URL = 'https://pic.netbian.com' // 4K高清壁纸 - 彼岸图网

/**
 * 分类枚举: 动漫，风景，美女，游戏，影视，汽车。。。其他请直接访问源网站查看
 * [4kdongman, 4kfengjing, 4kmeinv, 4kyouxi, 4kyingshi, 4kqiche]
 * */

const currentPage = 2 // 当前页面

const requestUrl = currentPage > 1 ? `${TARGET_URL}/4kfengjing/index_${currentPage}.html` : `${TARGET_URL}/4kfengjing/`

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  Cookie: '__yjs_duid=1_7bed40bfc6d138792c8aab4cf33e156f1685428852336; zkhanecookieclassrecord=%2C53%2C',
}

function getBiAnWallpaperList() {
  return new Promise((resolve, reject) => {
    axios.get(requestUrl)
      .then(r => {
        let result = []
        const html = r.data
        const $ = cheerio.load(html)
        $('#main .clearfix li').each((index, element) => {
          const imgUrl = $(element).find('img').attr('src')
          result.push(`${TARGET_URL}${imgUrl}`)
        })
        resolve(result)
      })
      .catch(e => {
        console.error(e)
        reject(e)
      })
  })
}

async function downloadFile(url, index) {
  const filePath = path.join(__dirname, '..', '/static', '/4k高清壁纸') // static下创建

  await download(url, filePath, {
    filename: `高清壁纸_${index}` + '.jpeg',
    headers,
  }).then(() => {
    console.log(`下载 高清壁纸_${currentPage}_${index} 完成!`)
    return
  }).catch(err => {
    console.error(err)
  })
}

async function loadWallpaper() {
  const res = await getBiAnWallpaperList()
  let cur = 0
  while (cur < res.length) {
    await downloadFile(res[cur], cur)
    cur++
  }
}

loadWallpaper().then(r => { console.log('爬取4k高清壁纸成功！') })
