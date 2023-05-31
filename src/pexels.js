const axios = require('axios')
const path = require('path')
const download = require('download')

const TARGET_URL = 'https://www.pexels.com' // 免费素材图片网址

const headers = {
  Accept: '*',
  Connection: 'keep-alive',
  'Content-Type': 'application/json',
  Cookie: 'cf_clearance=4s8QKvJpQVinmG.58jDzZ2FBaWjFmfdJnQ4TGvYdPXk-1685428230-0-250; _sp_ses.9ec1=*; _sp_id.9ec1=eeddf26a-63b1-46bf-b139-730ae442a23c.1685428244.3.1685497071.1685434086.321393a4-8573-4287-bd7a-6b4edd8fa453.befe9f7f-3eaf-4fd4-93d7-84e78823501a.04d4e754-cfea-4ffd-aa61-cef4a149b852.1685497069809.2; OptanonConsent=isGpcEnabled=0&datestamp=Wed+May+31+2023+09%3A37%3A51+GMT%2B0800+(%E4%B8%AD%E5%9B%BD%E6%A0%87%E5%87%86%E6%97%B6%E9%97%B4)&version=202301.1.0&isIABGlobal=false&hosts=&landingPath=https%3A%2F%2Fwww.pexels.com%2Fzh-cn%2F&groups=C0001%3A1%2CC0002%3A0%2CC0003%3A0; __cf_bm=W5PD1vsd72XwLktxRk6BLeA3pSFhAgeFwXauZSCqNmI-1685497071-0-AafMaVGnq8ABRLTWqM5kC5yJMyXqM3ouKpgRP+RFZMOTbB6VSA8OrJt4hfmsUkTR588prHvCSTYDyGm77itzJ/TkRge1zoJ7s/OhJ0U8ybO5U0GsxG22bbLLKsa2cOOE9Q==; g_state={"i_p":1685583478965,"i_l":2}',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
  'Secret-Key': 'H2jk9uKnhRmL6WPwh89zBezWvr' // 和cookie一样这个需要登录后自己看请求接口并做替换,如果过期请自己替换
}

const params = {
  seed: new Date(),
  per_page: '10',
  seo_tags: true
}

function getPexelsUrlList() {
  return new Promise((resolve, reject) => {
    axios.get(`${TARGET_URL}/zh-cn/api/v2/feed`, { headers, params })
      .then(r => {
        let list = r.data.data.map(item => item.attributes?.image || '')
        resolve(list)
      })
      .catch(e => {
        console.error(e)
        reject(e)
      })
  })
}

async function downloadFile(img, index) {
  const filePath = path.join(__dirname, '..', '/static', '/4k高清素材') // static下创建

  await download(img.large || img.medium || img.small, filePath, {
    filename: `高清素材_${index}` + '.jpeg',
    headers,
  }).then(() => {
    console.log(`download 高清素材_${index} completed!`)
    return
  }).catch(err => {
    console.error(err)
  })
}

async function loadPexels() {
  const res = await getPexelsUrlList()
  let cur = 0
  // console.log(res)
  while (cur < res.length) {
    await downloadFile(res[cur], cur)
    cur++
  }
}

loadPexels().then(r => { console.log('爬取 高清素材 成功！') })
