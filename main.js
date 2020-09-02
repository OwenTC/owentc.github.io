"#!use strict";

const manualOveride = new Map;
manualOveride.set('8/22', 33);
const totalDisplayedDates = 20, displayedMonths = 2;

$(function(){
    setupPage();
    
    $("#caseDays").html(totalDisplayedDates);
    $("#updateData").hover(() => {
        $("#updateData").css("background-color", "#000");
    },() => {
        $("#updateData").css("background-color", "rgb(92, 91, 91)");
    });
    $("#updateData").click(function(){
        $("#updateData").css("background-color", "#FFF");
        setupChart().then((res,rej) => {
            $("#updateData").css("background-color", "rgb(92, 91, 91)");
        });
    });

    
});

setupPage = () => {
    // Load google charts
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(setupChart);
}

//Gets and parses data from the GaTech health page
//parses the data, then sends it to the array.
setupChart = () => {
    return new Promise((resolve,reject) => {
        const graphHeaders = [['Date', 'Number of Cases']];

        $.get(`https://api.allorigins.win/get?url=${encodeURIComponent('https://health.gatech.edu/coronavirus/health-alerts')}`, (res) => {

            resContent = res.contents;


            //Find data with unique start key from webpage
            const startKey = "<h5>Campus Impact</h5>";
            const startExp = new RegExp(`${startKey}`, 'i');

            let resData = "";
            for(let i = 0; i < displayedMonths; i++){
                console.log(i);
                resContent = resContent.slice(startExp.exec(resContent).index + 1);
                thisMonthsData = getCovidTable(resContent);
                resData += thisMonthsData;
            }

            //Convert string of data into an array after removing all whitespace "\s"
            const completeTable = 
                $(resData.replace(/\s/g,'')).get().map(function(row) {
                    return $(row).find('td').get().map(function(cell) {
                    return $(cell).html();
                    });
                });            
           
                //Create Array of Dates and # of cases with reversed to go from earliest to latest date
            const sumCases = sumSimilar((completeTable), 0, totalDisplayedDates)
            dateNumArray = sumCases.array;
            totalCases = sumCases.total;
            
            //Display total cases:
            $("#totalCases").html(totalCases);

            //Display 7 Day Running Average or Most dates possible
            let dayTotal = 0;
            let days = 0;
            for(let i = 0; i < dateNumArray.length && i < 7; i++){
                dayTotal += dateNumArray[i][1];
                days++;
            }
            $("#average").html((dayTotal/days).toFixed(2));
            
            //Create chart data
            const data = google.visualization.arrayToDataTable(
                graphHeaders.concat(dateNumArray.reverse())
            );

            //Draw the chart with given paramaters
            drawChart(data);

            //Return that the data was successfully aquired
            resolve();
        });
    });
}

getCovidTable = (content) =>{
    const tableStart = /<tbody>/i.exec(content).index + 8;
    const tableEnd = /<\/tbody>/i.exec(content).index;

    return content.slice(tableStart, tableEnd);
}

//This function adds together the matching dates, returning an array
//with dates and number of cases
sumSimilar = (array, searchKey, max) => {
    let finalSummedArray = []; //Array with searchKeys and number of that element
    let total = 0; //Total elements found up to max

    //Iterate through all elements in array or until it reaches the max number to return
    let date = formatDate(array[0][searchKey]); 
    let newDate = date;
    for(let i = 0; i < array.length && finalSummedArray.length < max; date = newDate){
        let count = 0;
        let element = [];
       
        element.push(date); //Add date to element
        
        //For each date, itterate until that date changes adding up each occurence
        while(date == newDate){
            count ++;
            i++;
            if (i < array.length){ //Check if the array is still in bounds, 
                if(array[i][searchKey] != array[i-1][searchKey]){
                    newDate = formatDate(array[i][searchKey]);
                }
            }else{ //if not break
                break;
            }
        };
        
    
        //Add the count to the element
        element.push(count);
        
        //Check manual overide for incorrect counts
        if (manualOveride.has(element[0])){
            element[1] = manualOveride.get(element[0]);
        }

        total = i;
        console.log(`total: ${total}`)

        finalSummedArray.push(element) 
        
    }
    //Combine Possible Duplicates
    return {array: finalSummedArray, total: total};
}

//Creates a map of Months to numbers. 
//i.e: January:1, Feburary:2 ... December:12
getMonthMap = () => {
    let monthToNum = new Map();
    const month = [
        'January', 'Feburary', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    for(let i = 0; i < month.length; i++){
        monthToNum.set(month[i], i+1);
    }
    return monthToNum;
}

//Formats date by searching for month in map and retuning
//monthnum/monthday
formatDate = (dateTxt, monthMap = getMonthMap()) => {
    //Regex match the date with Month in group 1 and day in group 2
    const dateRegex = /([A-Z][a-z]*)([0-9]*)/i;
    monthDay = dateTxt.match(dateRegex);
    
    //Search the month map for the date
    const month = monthMap.get(monthDay[1]);
    return (month + "/" + monthDay[2]);
}

lastInArray = (length) => {
    if(length - 1 > 0 ){
        return length
    }
    return 0;
}

// Draw the chart and set the chart values
drawChart = (data) => {
    //Set table style
    var options = {
        titlePosition: 'none',
        fontSize: 18,
        legend: 'none',
        colors:  ['#B3A369'],
        bar: { groupWidth: "90%" },
        lineWidth: 10,
    };

    // Display the chart inside the <div> element with id="piechart"
    var chart = new google.visualization.ColumnChart(document.getElementById("graph"));
    chart.draw(data,(options));
}

