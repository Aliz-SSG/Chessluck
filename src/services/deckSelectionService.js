
function getRandomDecks(pool, count = 3) {
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
module.exports = getRandomDecks
