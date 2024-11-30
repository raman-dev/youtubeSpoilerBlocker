//only track time of specific sites
//user enters site
//show list of time spent on sites we're tracking
//show input dialog to add site
//show x right of time item to stop tracking site
//

class ChromeAPI {
    static setTabActivatedListener(func){
        chrome.tabs.onActivated.addListener(func);
    }

    static setTabUpdatedListener(func){
        chrome.tabs.onUpdated.addListener(func);
    }

    static setWebNavOnComittedListener(func,filters){
        chrome.webNavigation.onCommitted.addListener(func,filters);
    }

    static setWebNavOnCompleteListener(func,filters){
        chrome.webNavigation.onCompleted.addListener(func,filters);
    }

    static setAlarmFunction(input){
        //create alarm if not already created
        if(chrome.alarms.get(input.alarmName,(alarm) => {
            if(alarm == null){
                chrome.alarms.create(input.alarmName,{ periodInMinutes: input.period });
                console.log(`${input.alarmName} alarm created!`);
            }
        }));
        // //update storage every mimnute not just on active tab change
        chrome.alarms.onAlarm.addListener(input.alarmFunction);
    }
    
    static clearAlarm(alarmName){
        chrome.alarms.clear(alarmName,(wasCleared)=>{
            console.log(`${alarmName} alarm was cleared!`);
        });
    }

    static setMessageReceiver(receiver){
        chrome.runtime.onMessage.addListener(receiver);
    }

    static readFromStorage(key,resultFunction){
        chrome.storage.sync.get([key],resultFunction);
    }
    /**
     * Save tracking data to chrome.storage api by date
     */
    static saveTrackingToStorage(key,value){
        chrome.storage.sync.set({key: value},()=>{});
    }
}

//parse any youtube webpage
//change the style of specific elements to hide spoilers
//check titles of videos for spoiler search terms

//ytd-video-renderer
//dismissable 
//ytd-compact-video-renderer
//ytd-rich-item-renderer
const prohibitedList = new Array();//read 
function onLoadBackgroundJS(){
    console.log('onLoadBackgroundJS');
    //perform what i want when background js is loaded here
    // ChromeAPI.readFromStorage('prohibitedList',(result) => {
    //     if(result != null ){
    //         if(result['prohibitedList'] != null){
    //             result['prohibitedList'].forEach( (i,x) => {
    //                 prohibitedList.push(x);
    //             });
    //         }
    //     }
    // });
    // ChromeAPI.setTabUpdatedListener( (tabId,changeInfo, tab)=>{
    //     console.log(`${tab.url} tab updated!`);
    // });
    const filter = {
        url: [
            {
            urlMatches: 'https://www.youtube.com/',
            },
        ],
    };
    ChromeAPI.setWebNavOnCompleteListener(() => {
        console.info("onCompleteListener");
    }, filter);
    ChromeAPI.setWebNavOnComittedListener( (details) => {
        console.log('onComittedListener()');
    },{
        url:[{
            urlMatches:'https://www.youtube.com/'
        }]
    });
      
}
function processPage(){
    let videoItems = Array.from(document.querySelectorAll('ytd-rich-item-renderer'));
    //after we grab the items
    //we need to find the title
    //check if the title contains any terms from prohibited
    //list
    //grabs the thumbnail overlay thing
    videoItems.forEach( (index,element)=>{
        let titleElement = element.querySelector('#content ytd-rich-grid-media #dismissible #details #meta h3 a');
        if(titleElement != null){
            let title = titleElement.getAttribute('aria-label');
            //check if it has a prohibited string
            if(containsProhibited(title)){
                //hide thumbnail
                element.querySelector('#content ytd-rich-grid-media #dismissible ytd-thumbnail a yt-img-shadow').style.width="0%";
                //hide title
                element.querySelector('#content ytd-rich-grid-media #dismissible #details #meta h3').style.width="0%";
            }
        }
    });
}


function containsProhibited(title){
    //check our saved prohibited list for 
    //for title
    prohibitedList.forEach((index,element)=>{
        if(title.contains(element)){
            return true;
        }
    });
    return false;
}

onLoadBackgroundJS();
