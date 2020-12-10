import { bookReviews, books, orders } from "./data";
import {Book, DiscountCode, Order, OrderLine} from "./definitions";
console.clear();

//1. ¿Cuántos libros tienen género asignado?
const NO_GENRE = "(no genres listed)";
const hasGenreListed = (b: Book) => b.genre !== NO_GENRE
const booksByGenre = books.filter(hasGenreListed);
console.log(`¿Cuántos libros tienen género asignado? ${booksByGenre.length}`);

//2. ¿Cuántos géneros distintos tenemos entre todos nuestros libros?
// const select = (key: keyof Book) => (b: Book) => b[key];
// const getGenre = select("genre"); //TODO problema , select puede devolver string | number
const getGenre = (b: Book) => b.genre;
const genreList = booksByGenre.map(getGenre);
const splitGenres = (s: string) => s.includes("|") ? s.split("|") : s;

function distinctValues(values: string[], distinct: string[] = []): string[]{
    distinct = Array.from(new Set(values
        .map(splitGenres)
        .flatMap(_ => _)));
    return distinct;
}
const distinctGenresLength = distinctValues(genreList).length;
console.log(`¿Cuántos géneros distintos tenemos entre todos nuestros libros? ${distinctGenresLength}`);

//3. Listar/Agrupar los libros por género
interface BooksByGenre {
    [genre:string]:Array<Book>
}

function groupBooksByGenre(booksByGenre: BooksByGenre,book: Book) {
    //const genres = splitGenres(book.genre);
    const genres = book.genre;
    return{
        ...booksByGenre,
        [genres]: [...(booksByGenre[genres] || []), book]//TODO fix groupByGenre
    };
}
const groupedBooksByGenre = books.reduce(groupBooksByGenre,{});
console.log('Grouped books by genre ',groupedBooksByGenre);

//4. Puesto que cada Order tiene un total, pero no está calculado, se pide actualizar cada order con su total
const findBookId = (id:number) => (b: Book) => b.id === id;
const getBookPriceById = (bookId:number) => books
    .find(findBookId(bookId))
    .price;
const addOrderLineSumToTotal = (acc: number,curr: OrderLine) => acc + getBookPriceById(curr.bookId) * curr.quantity;
const totalSum = (o: Order) => o.total = Number(o.orderLines
    .reduce(addOrderLineSumToTotal,0)
);
const calculateDiscount = (price:number, discount: number) => price - price * discount;
const getTotalWithDiscount = (o: Order) => o.discount ? calculateDiscount(totalSum(o),o.discount): totalSum(o) ;
const updateOrderTotal = (o: Order) => o.total = Number(getTotalWithDiscount(o).toFixed(2));
function transformOrders (o: Order){
    o.total = updateOrderTotal(o);
    return o;
}
//const clonedOrders = cloneDeep(orders); //CON LODASH https://stackoverflow.com/questions/44808882/cloning-an-array-in-javascript-typescript
const clonedOrders = JSON.parse(JSON.stringify(orders)); // CON JSON.parse https://stackoverflow.com/questions/47776776/how-to-clone-array-of-objects-typescript?noredirect=1&lq=1
const ordersWithTotal = clonedOrders.map(transformOrders);
//const ordersWithTotal = orders.map(transformOrders);//TODO test conforme se modifica el array original al hacer el map
console.log('Original orders ',orders);
console.log('Orders with total ',ordersWithTotal);

//5. ¿Cuántos libros del género thriller con un precio menos a 15$ tenemos?
type Predicate = (b: Book) => boolean;
const isThriller = (b: Book) => b.genre.includes('Thriller');
const priceLowerThan15 = (b: Book) => b.price < 15;
const where = (conditions: Array<Predicate>) => (b: Book) => conditions.every(c => c(b));

console.log(`¿Cuántos libros del género thriller con un precio menos a 15$ tenemos? ${books
    .filter(where([isThriller,priceLowerThan15]))
    .length}`);

//6. ¿Cuáles son los 3 géneros con más libros y los 3 géneros con menos libros?
const top3Genres = Object.entries(groupedBooksByGenre)
    .sort(([, booksA]: [string, Array<Book>], [,booksB]: [string, Array<Book>]) => booksB.length - booksA.length)
    .slice(0, 3);
const worst3Genres = Object.entries(groupedBooksByGenre)
    .sort(([, booksA]: [string, Array<Book>], [,booksB]: [string, Array<Book>]) => booksA.length - booksB.length)
    .slice(0, 3);
console.log('Top 3 genres: ',top3Genres);
console.log('Worst 3 genres: ',worst3Genres);

//7. ¿Cuánto dinero hemos ganado con los libros del género 'Fantasy'?
const isFantasy = (b:Book) => b.genre.includes('Fantasy');
const getFantasyBooks = books.filter(isFantasy);
const sumBookPrice = (acc: number ,curr: Book) => acc + curr.price;
const calculateFantasyBooksIncome = getFantasyBooks
    .reduce(sumBookPrice,0)
    .toFixed(2);
console.log(`¿Cuánto dinero hemos ganado con los libros del género 'Fantasy'? ${calculateFantasyBooksIncome}`);

//8. ¿Cuáles son los 3 géneros con más ingresos?
// interface GenresByIncome { TODO  no acabo de ver esto de la interface para despues operar con ella
//     genre:string,
//     income:number
// }
const getBooksIncome = (books: Array<Book>) => books.reduce(sumBookPrice, 0);
const groupGenresByIncome = (v) =>  [v[0],Number(getBooksIncome(v[1]).toFixed(2))];
const calculateIncomeByGenre = Object.entries(groupedBooksByGenre).map(groupGenresByIncome);
const top3GenresByIncome = calculateIncomeByGenre
    .sort((v, v2) => v2[1] - v[1])
    .slice(0,3);
console.log(`¿Cuáles son los 3 géneros con más ingresos?` , top3GenresByIncome);

//9. ¿Cual es el título, autor y precio del libro con el que hemos ingresado más?
// type TopBook = {
//     titulo:string;
//     autor:string;
//     precio: number;
// }
interface BooksByIncome {
    bookId: number,
    quantity: number
}

function groupBooksByIncome(orderLine: OrderLine,booksByIncome: BooksByIncome) {
    const bookId = orderLine.bookId;
    return{
        ...booksByIncome,
        [bookId]: [...(booksByIncome[bookId] || []), orderLine.quantity]
    };
}

const getOrderLines = orders.map((v) => v.orderLines);
//const groupByBookIdPlusQuantity2 = getOrderLines.reduce(groupBooksByIncome);
// const groupByBookIdPlusQuantity2 = getOrderLines.map((v,i) => v[i].bookId ? v[i].quantity + 1 : v[i].quantity);
console.log(getOrderLines);
