const axios = require('axios')
const cheerio = require('cheerio')

async function getImageUrl(target_url, containerEle) {
  let result_list = []
  const res = await axios.get(target_url)
  const html = res.data
  const $ = cheerio.load(html)
  $(containerEle).each((element) => {
    result_list.push($(element).find('img').attr('src'))
  })
  return result_list
}
