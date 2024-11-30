//need to grab prohibited list from chrome.runtime.
//send message
const listKey = 'prohibitedList';


function getProhibitedWordList(){
    //query a prohibited word regardless of category
    chrome.storage.sync.get([listKey], function(result) {
        //return a map of categories
        //that map to a list of words prohibited per categor
        if(result != null ){  
            if(result[listKey] != null){
                //need to set activeUrl
                // console.log(result[listKey]);
                console.log(`read from storage => ${result.prohibitedList}`);
                result.prohibitedList.forEach( (x) => {
                    prohibitedList.push(x);
                });
            }
        }
    });
}

const prohibitedList = new Array(); 
getProhibitedWordList();

console.log(prohibitedList);

function containsProhibited(words){
    //check our saved prohibited list for
    //for tit   le
    for (const word of words){
        let i = 0;
        while(i < prohibitedList.length){
            if(word.toLowerCase().includes(prohibitedList[i])){
                return true;
            }
            i++;
        }
    }
    
    return false;
}

const ytdPageManager = 'ytd-page-manager';
const ytdPageObserverMap = new Map();
const ytdPageRowDefaultObserverConfig = {
    childList: true,
    subtree: false
}

/*

youtube is a single page application

goal - know when page has changed from browse | search | watch | channel

    ytd-browse
        page-subtype = [ home,channels,explore ]
    ytd-watch-flexy
    ytd-search

    nested observers zzzzzzzzzzzz


    observer rows
        
    ytd-popup-container <---remove this element always


*/

/*

   processor -> process page
   monitor -> watch for changes on the page

    
    ytd-browse page-subtype='home'{
        ytd-two-column-browse-results-renderer{
            ytd-rich-grid-renderer{
                #contents{
                    ytd-rich-grid-row {
                        #contents{
                            ytd-rich-item-renderer{
                                ytd-thumbnail
                                h3 a.title
                            }
                        }
                    }
                }
            }
        }
    }

    ytd-browse page-subtype='explore'{
        ytd-column-browse-results-renderer{
            ytd-section-list-renderer{
              n * ytd-item-section-renderer{
                    ytd-expanded-shelf-contents-renderer{
                        #grid-container{
                            ytd-video-renderer{
                                ytd-thumbnail
                                h3 a.title
                            }
                        }
                    }
                }
            }
        }
    }

    ytd-browse page-subtype='channels'{
        ytd-two-column-browse-results-renderer{
            ytd-section-list-renderer{
                ytd-item-section-renderer{
                    #items{
                        ytd-grid-renderer{
                            ytd-thumbnail
                            h3 a.title
                        }   
                    }
                    
                }
            }
        }
    }

    ytd-watch-flexy{
        #columns{
            ytd-watch-next-secondary-results-renderer{
                #items{
                   n * ytd-compact-video-renderer{
                         ytd-thumbnail
                         h3 span.title
                       }
                }
            }
        }
    }

    ytd-search{
        ytd-two-column-search-results-renderer {
            ytd-section-list-renderer{
                #contents{
                    ytd-item-section-renderer{
                        #contents{
                            ytd-video-renderer{
                                ytd-thumbnail
                                h3 a.title
                            }
                        }
                    }
                }
            }
        }
    }


*/


const pageElementContainerMap = {
    'home' : {
        mediaElementSelector: 'ytd-rich-item-renderer',

        titleTextSelector:'h3 a',
        thumbnailSelector : 'ytd-thumbnail',
         
        rowsAreItems: false,
        rowContainerSelector: '#contents',
        rowName: 'YTD-RICH-GRID-ROW',
        rowSelector :'ytd-rich-grid-row',
    },
    'channels' : {
        mediaElementSelector : 'ytd-grid-video-renderer',
        titleTextSelector:'h3 a',
        thumbnailSelector : 'ytd-thumbnail',

        rowsAreItems: true,
        rowItemContainerSelector: 'ytd-grid-renderer #items',
    },
    'fashion':{
        mediaElementSelector : 'ytd-grid-video-renderer',
        titleTextSelector:'h3 a',
        thumbnailSelector : 'ytd-thumbnail',
    },
    'sports' : {
        mediaElementSelector : 'ytd-rich-item-renderer',
        titleTextSelector:'h3 a',
        thumbnailSelector : 'ytd-thumbnail',
    },
    'explore':{
        mediaElementSelector: 'ytd-video-renderer',
        titleTextSelector: 'h3 a',
        thumbnailSelector: 'ytd-thumbnail'
    },
    'search' : {
        mediaElementSelector:'ytd-video-renderer',
        titleTextSelector : 'h3 a',
        thumbnailSelector : 'ytd-thumbnail',

        rowsAreItems: false,
        rowContainerSelector:'ytd-section-list-renderer #contents',
        rowName:'YTD-ITEM-SECTION-RENDERER',
        rowSelector:'#contents',
    },
    'watch' : {
        mediaElementSelector:'ytd-compact-video-renderer',
        
        titleTextSelector : 'h3 span',
        thumbnailSelector : 'ytd-thumbnail',
        
        rowsAreItems: true,//rows are media items instead of containers
        rowItemContainerSelector: 'ytd-watch-next-secondary-results-renderer #items',
    },
    
}

const ytdPageData = {
    page: null,
    pageElement: null,
    pageSelectors: null,
    rowMutationObserver: null,
}
const YTD_PAGE_TYPES = {
    YTD_BROWSE: 'YTD-BROWSE',
    YTD_WATCH: 'YTD-WATCH-FLEXY',
    YTD_SEARCH: 'YTD-SEARCH',
}

function processElement(x){
    let mediaElement = $(x);
    let titleElement = mediaElement.find(ytdPageData.pageSelectors.titleTextSelector)[0];//
    if (titleElement != null && titleElement.title != null){
        // console.log(titleElement.title);
        if (containsProhibited(titleElement.title.split(' '))){
            //set opacity of element to 0
            //console.log(`${titleElement.title} blocked`);
            mediaElement[0].classList.add('spoiler-block');
            mediaElement[0].classList.add('spoiler-block-'+ytdPageData.page);
        }
    }
}


var globalObserver = null;
var resizeProcessHandler = null;
function resizeListener(){
    console.log('resizing');
    if (resizeProcessHandler != null){
        clearTimeout(resizeProcessHandler);
    }
    resizeProcessHandler = setTimeout(()=>{
        console.log('resized settle');
        processPage2(true);//reprocess page
    },1000);
}

$(window).resize(resizeListener);

function clearPrevousBlocks(){
    if (ytdPageData.pageElement != null){
        $(ytdPageData.pageElement).find('.spoiler-block').each((i,x) => {
            // let classList = x.classList;
            // console.log(x.nodeName + ' clearing old!');
            x.classList.remove('spoiler-block');
            x.classList.remove('spoiler-block-'+ytdPageData.page);
        });
    }
}

function processPage2(wasResized){
    
    // console.log('processPage2');
    // if (wasResized){
    clearPrevousBlocks();
    // }
    $(ytdPageData.pageSelectors.mediaElementSelector).each((i,x)=>{
        processElement(x);
    });

    //ytdPageData.pageElement  
    //make sure gc occurs no need to hold on to observers
    //clear previous ones
    if (!wasResized){
        globalObserver = new MutationObserver((mutationList,observer)=>{
            for (const mutation of mutationList){
                for (const node of mutation.addedNodes){
                    if (node.nodeName == ytdPageData.pageSelectors.mediaElementSelector.toUpperCase()){
                        console.log(`${node.nodeName}`);
                        processElement(node);
                    }
                }
            }
        });
        globalObserver.observe(ytdPageData.pageElement,{childList:true,subtree:true});
    }

}
//TODO do stuff
/*
    handle mutations

    - row mutations 
    - resize mutations

    if new row:
        process new row
    if row items changed:
        re-process entire page 

*/

function isCurrentPage(node){
    let role = node.role;
    if (role != null){
        switch(node.nodeName){
            case YTD_PAGE_TYPES.YTD_BROWSE:
                //use subtype since multiple browse page types
                return node.getAttribute('page-subtype');
            case YTD_PAGE_TYPES.YTD_WATCH:
                return 'watch';
            case YTD_PAGE_TYPES.YTD_SEARCH:
                return 'search';
        }
    }
    return null;
}
/*
            
        when switching pages

        FROM
        
            page0 -> hidden change
            page0 -> role change
        
        TO
        
            page1 -> hidden change
            page1 -> role change
   
*/
function ytdPageManagerItemMutationCallback(mutationList,observer) {
    //react to changes in hidden status
    for (const mutation of mutationList){
        if (mutation.type == 'attributes'){
            //do what check value of attribute
            
            let page = isCurrentPage(mutation.target);
            if (page != null){
                console.log(`currentPage => ${page}`);
                ytdPageData.page = page;
                ytdPageData.pageElement = mutation.target;
                ytdPageData.pageSelectors = pageElementContainerMap[page];
                processPage2(false);
            }
        }
    }
}


function ytdPageManagerMutationCallback(mutationList,observer) {
    for (const mutation of mutationList){
        if (mutation.type == 'childList'){
            // console.log('added child');
            for (const node of mutation.addedNodes){
               ytdPageManagerChildren.push(node);
               ytdPageManagerChildMutationObserver.observe(node,ytdPageManagerChildMutationObserverConfig);
            }
        }
    }
}

function onInjectContentScript(){
    //send a message to the
    //need to run everytime dom changes
    setTimeout( () =>{
        
        let pageManager = document.querySelector(ytdPageManager);
        let page = null;
        let pageElement = null;
        for(const node of pageManager.children){
            ytdPageManagerChildren.push(node);
            ytdPageManagerChildMutationObserver.observe(node,ytdPageManagerChildMutationObserverConfig);
            if (page == null){
                pageElement = node;
                page = isCurrentPage(node);
            }
        }
        console.log(`currentPage => ${page}`);
       
        if (page != null){
            previousPage = ytdPageData.page;
            ytdPageData.page = page;
            ytdPageData.pageElement = pageElement;
            ytdPageData.pageSelectors = pageElementContainerMap[page];

            processPage2(false);
        }    

        ytdPageManagerMutationObserver.observe(pageManager,{
            childList:true,
            subtree:false
        });
    },3000);
    
}

const ytdPageManagerMutationObserver = new MutationObserver(ytdPageManagerMutationCallback);
const ytdPageManagerChildMutationObserver = new MutationObserver(ytdPageManagerItemMutationCallback);
const ytdPageManagerChildren = [];


const ytdPageManagerChildMutationObserverConfig = {
    childList:false,
    attributes : true,
    attributeFilter : ['role']
}

/**


 */
onInjectContentScript();
//runs on page load
//runs if link clicked on full window page
/*


 inject content script
    - parse page
    - if title contains prohibited word hide title

    inject()
        parse()
          containsProhibited()
            hide()
        scheduleRunAgain()

*/