/*

structure 

what it is?
    - hides images, and video titles on youtube if the title contains a word i don't want to see
how it works?
    - content-script.js injects javascript into the webpage 
        - script will find titles that contain a prohibited word then
          hide the title and hide the thumbnail
    -ui to add/remove words to prohibited list
        -should i have categories
        -maybe maybe not how much am i really going to be blocking
        -like if im watching a show or something i can just add words that i want to block
        -but then again when i am watching something
        -i can always make this more complicated than it already is what i needd is a viable product
        - so a list of words is enough
        - i don't need categories

*/

const listKey = 'prohibitedList';
const prohibitedWordSet = new Set();

var refreshNotificationHeight = $('.refresh-notification').outerHeight();
//hide refresh notification
$('.refresh-notification').css({'height':'0px'});

function showRefreshNotification(){
    $('.refresh-notification').css({'height':refreshNotificationHeight});
}

function updateChromeStorage(){
    console.log(prohibitedWordSet);
    chrome.storage.sync.set({'prohibitedList': Array.from(prohibitedWordSet)}, (value) => {
        // console.log(`Value is set to ${value.prohibitedList}`); 
    });
}

function getListFromChromeStorage(){
    chrome.storage.sync.get([listKey], (result)=>{
        if(result != null ){  
            if(result[listKey] != null){
                //need to set activeUrl
                // console.log(result[listKey]);
                console.log(`read from storage => ${result.prohibitedList}`);
                result.prohibitedList.forEach( (x) => {
                    prohibitedWordSet.add(x);
                });
                renderWords();
            }
        }
    });
}

function getWordDOMElement(value){
    return $.parseHTML(
    `<li class="word mr-1 mb-1 p-1 rounded-full"> 
        <button class="word-delete"><img src="close_black_24dp.svg"></button>   
        <p>${value}</p>
    </li>`);
}

function onClickDeleteWord(event){
    // console.log('called onClickDeleteWord');
    //delete this item from the word-list
        //get immediate parent
        //get the word that should be removed
        let categoryItem = $(event.currentTarget).parent();
        //remove categoryItem from dom
        let value = categoryItem.children('p').text();
        categoryItem.remove();
        //propagate to chrome extension here
        if(prohibitedWordSet.has(value)){
            prohibitedWordSet.delete(value);
        }
        showRefreshNotification();
        updateChromeStorage();
}

$('.add-word-button').on('click',(event)=>{
    //get input value
    let inputValue = $('.word-input input').val();
    if(inputValue == null || inputValue.length == 0){
        return;
    }
    //avoid duplicates
    if (!prohibitedWordSet.has(inputValue)){
        showRefreshNotification();
        prohibitedWordSet.add(inputValue);
        updateChromeStorage();
        addWordToList(inputValue);
        //return wordList.children().length;
    }
});

function addWordToList(value){
    let newWordItem = getWordDOMElement(value);
    let wordList = $('.word-list');
    $(newWordItem[0]).children('button').on('click',onClickDeleteWord);
    wordList.append(newWordItem);
}

function renderWords(){
    prohibitedWordSet.forEach( word => {
        addWordToList(word);
    });
}
getListFromChromeStorage();

//THIS WAS UNNECESSARY COMPLEXITY BUT KEEP CODE FOR REFERENCE
// $('.category-list-item').on('click',(event)=>{
//     if(event.target.hasAttribute('data-collapse-open')){
//         //let target = $(event.target);
//         // console.log(event.target);
//         // console.log(event.currentTarget);
//         //check if the clicked target is the collapse toggle
//         let collapseToggle = $(event.target);
//         let collapseElement = $(event.currentTarget).children('.collapse');
//         listItemClickListener(collapseToggle,collapseToggle.children('.collapse-icon'),collapseElement);
//     }else if(event.target.classList.contains('category-item-add')){
//         // console.log('clicked add button!');
//         let categoryListItem = $(event.currentTarget);
//         let wordList = categoryListItem.find('.collapse .word-list');
//         let inputValue = categoryListItem.find('.collapse .category-item-input input').val();
//         // console.log(wordList[0]);
//         // console.log(inputValue);
//         let wordCount = addNewCategoryItem(wordList,inputValue);
//         let itemCountLabel = categoryListItem.find('.collapse-toggle .category-item-count');
//         //set the item count;
//         itemCountLabel.text(`${wordCount} items`);
//     }
// });

// function listItemClickListener(collapseToggle,collapseIcon,collapseElement){
//     //expand from here
//     let height = collapseElement[0].scrollHeight;
//     let openState = collapseToggle.attr('data-collapse-open');

//     if(openState == "false"){
//         collapseElement.css({ 
//             'max-height': height
//         });
//         collapseToggle.attr('data-collapse-open','true');
//         collapseToggle.addClass('collapse-toggle-open');
//         collapseIcon.css({'transform':'rotateZ(180deg)'});
//     }else{
//         collapseElement.css({
//             'max-height':'0px'
//         });
//         collapseToggle.attr('data-collapse-open','false');
//         collapseToggle.removeClass('collapse-toggle-open');
//         collapseIcon.css({'transform':'rotateZ(0deg)'});
//     }
    
// }

// $('.category-item-delete').on('click',onClickDeleteItem);

// function onClickDeleteItem(event){
// //delete this item from the word-list
//     //get immediate parent
//     let categoryItem = $(event.currentTarget).parent();
//     //remove categoryItem from dom
//     categoryItem.remove();
//     //propagate to chrome extension here
//     updateChromeStorage();
// }

// function getWordListItem(value){
//     return jQuery.parseHTML(
//     `<div class="category-item m-1 p-1 rounded-full">
//         <button class="category-item-delete"><img src="close_black_24dp.svg"></button>  
//         <p>${value}</p>
//     </div>`);
// }


// function addNewCategoryItem(wordList,itemValue){
//     if(itemValue == null || itemValue.length == 0){
//         return wordList.children().length;
//     }
//     let newWordItem = getWordListItem(itemValue);
    
//     wordList.append(newWordItem);
//     $(newWordItem[0]).children('button').on('click',onClickDeleteItem);
//     return wordList.children().length;
// }

