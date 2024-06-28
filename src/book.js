const puppeteer = require('puppeteer-core')
const fs = require('fs')
const path = require('path')

const bookRootUri = 'https://www.zzxx.org' // 笔趣阁网站地址
let bookName = ''
let bookAuthor = ''

/**
 * 通过书名和作者下载电子书
 * @param bookName string
 * @param author string
 * @description 只输入书籍名称会从搜索结果第一个下载，可输入作者名更精确过滤或者输入书籍全名称搜索
 * */
async function searchBookByNameOrAuthor(bookName, author) {
  // 可搜书名和作者，可少字不能错字
  const url = `${bookRootUri}/user/search.html?q=${bookName}`
  await getPageInfo(url, author)
}

async function getPageInfo(url, author) {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ignoreHTTPSErrors: true,
  })
  const page = await browser.newPage()
  await page.goto(url)

  // 1. 获取搜索结果
  const bookLink = await getSearchBooks(page, author)

  // 2. 获取书籍信息
  const result = await getBookInfo(page, bookLink)

  // 3. 下载书籍
  downloadBook(result)

  await browser.close()
}

async function getSearchBooks(page, author) {
  await page.waitForSelector('#bookcase', { timeout: 5000 })
  // 搜索结果
  const searchResult = await page.$$eval('#book-list li', books => books.map((book, i) => {
    if (i > 0) {
      const bookItem = Array.from(book.querySelectorAll('span'))
      if (bookItem[2].querySelector('a')) {
        return {
          name: bookItem[2].querySelector('a').title, // 书名
          author: bookItem[3].innerText, // 作者
          link: bookItem[2].querySelector('a').href, // 地址
        }
      }
    }
  }))
  console.log(searchResult)

  return new Promise(async resolve => {
    const bookArr = [...searchResult.filter(book => book)]
    if (bookArr.length < 1) {
      console.log('无数据，或者页面卡顿，可以多重试几次')
      resolve(null)
    } else {
      const bookInfo = bookArr.find(book => book.author?.includes(author?.trim()))
      const bookLink = bookInfo?.link || bookArr[0].link
      bookName = bookInfo?.name || bookArr[0].name // 全局书籍名称赋值
      bookAuthor = bookInfo?.author || bookArr[0].author // 全局作者名称赋值
      resolve(bookLink)
    }
  })
}

async function getBookInfo(page, url) {
  await page.goto(url)
  // 书名
  const bookName = await page.$eval('.info .infobar h1', el => el.innerText)
  // 目录列表
  const directoryItems = await page.$$eval('#list a', links => links.map(link => link.href))
  // 文本内容
  let fullText = `《${bookName}》` + '\n\n'

  return new Promise(async resolve => {
    console.log('\x1b[34m%s\x1b[0m', `开始组织小说 --《${bookName}》 作者：${bookAuthor} -- \n`)
    // 模拟循环点击目录查看每章节内容并拼接content
    for (let link of directoryItems) {
      await page.goto(link)

      const maxRetries = 5 // 最大重试次数
      let retries = 0
      let success = false
      while (retries < maxRetries && !success) {
        try {
          await page.waitForSelector('.readbar', { timeout: 3000 }) // 等待3秒
          success = true // 如果上述代码未抛出错误，则认为成功找到元素
        } catch (error) {
          retries++ // 如果出现错误（例如超时），增加重试次数
          console.log(`Retry ${retries}...`)
          await page.waitForTimeout(1000) // 等待1秒后再次尝试
        }
      }

      if (!success) {
        console.info(`puppeteer浏览页面时重现问题，请重试`)
      } else {
        const textTitle = await page.$eval('.bookname h1', el => el.innerText)
        const textContent = await page.$$eval('#htmlContent p', el => {
          let res = ''
          for (let element of el) {
            res += element.innerText
          }
          return res
        })
        console.log(`正在组织章节 -- ${textTitle} --`)
        fullText += textTitle + '\n' + textContent + '\n\n'
      }
    }
    resolve(fullText)
  })
}

function downloadBook(content) {
  const filePath = path.join(__dirname, '..', '/static', `/${bookName}.txt`) // static下创建

  fs.writeFileSync(filePath, content)
}

// 输入例子：1. '鬼吹灯'；2. '鬼吹灯，天下霸唱'；3. '笑傲江湖，金'；
// 搜索会有多个结果，增加作者名称来获得更精确的结果
searchBookByNameOrAuthor('贼猫', '天下霸唱').then(r => {
  console.log('已完成下载书籍:' + bookName)
})