const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient()

let comboListJson = require('../comboList.json')

module.exports = function filterCombo(user, comboList, from, to, search) {
    console.log('filterCombo', from, to, comboList.length, search)
    if (!user || !comboList?.length) return []
    let filtredCombo = []
    for (let i = 0; i < comboList.length; i++) {
        let item = comboList[i]
        if (item.price >= user.combo.find(c => { return c.name == item.comboId }).priceDown && item.price <= user.combo.find(c => { return c.name == item.comboId }).priceUp
            /* && comboListJson.find(combo => combo.id == comboList[i].comboId).size.includes(item.size) */)
            filtredCombo.push(item)
    }
    if (search && search.length > 0) {
        filtredCombo = filtredCombo.filter(combo => {
            return combo.title.toLowerCase().includes(search.toLowerCase())
        })
    }
    return filtredCombo.slice(from, to)
}