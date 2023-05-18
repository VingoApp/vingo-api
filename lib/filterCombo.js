const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient()

let comboListJson = require('../comboList.json')

module.exports = async function filterCombo(user, comboList) {
    if (!user || !comboList?.length) return []
    let filtredCombo = []
    for (let i = 0; i < comboList.length; i++) {
        let item = comboList[i]
        if (item.price >= user.combo.find(c => { return c.name == item.comboId }).priceDown && item.price <= user.combo.find(c => { return c.name == item.comboId }).priceUp
            /* && comboListJson.find(combo => combo.id == comboList[i].comboId).size.includes(item.size) */)
            filtredCombo.push(item)
    }
    console.log(filtredCombo.length + ' combo(s) filtred')
    return filtredCombo
}