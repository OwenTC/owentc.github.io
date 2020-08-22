


$(function(){
    setupPage();
    
    $("#updateData").hover(() => {
        $("#updateData").css("background-color", "#000");
    },() => {
        $("#updateData").css("background-color", "rgb(92, 91, 91)");
    });
    $("#updateData").click(function(){
        $("#updateData").css("background-color", "#FFF");
        setupChart().then((res,rej) => {
            $("#updateData").css("background-color", " rgb(92, 91, 91)");
        });
    });

    
});

setupPage = () => {
    // Load google charts
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(setupChart);
    $("#updateMsg").hide();
}

setupChart = () => {
    return new Promise((resolve,reject) => {
        const graphHeaders = [['Date', 'Number of Cases']];

        $.get(`https://api.allorigins.win/get?url=${encodeURIComponent('https://health.gatech.edu/coronavirus/health-alerts')}`, (res) => {  

            resContent = res.contents;

            //Find all of the data
            const startKey = "<h5>Campus Impact</h5>\\n\\t\\t\\t</th>\\n\\t\\t</tr>\\n\\t</thead>\\n\\t<tbody>"; //<h5>Campus Impact</h5>\n\t\t\t</th>\n\t\t</tr>\n\t</thead>\n\t
            const endKey = "</tbody>"; //\n\n<p class=\"cutline-text\"><strong>
            const endExp = new RegExp(`${endKey}`, 'i')
            const startExp = new RegExp(`${startKey}`, 'i')
            resContent = resContent.slice(startExp.exec(resContent).index)
            resContent = resContent.slice(/<tbody>/i.exec(resContent).index + 8, endExp.exec(resContent).index);

            //Convert string of data into an array
            const completeTable = $(resContent.replace(/\s/g,'')).get().map(function(row) {
                return $(row).find('td').get().map(function(cell) {
                return $(cell).html();
                });
            });
            
            //Create Array of Dates and # of cases
            dateNumArray = sumSimilar(completeTable, 0)
            
            let graphData = graphHeaders.concat(dateNumArray.reverse());
            var data = google.visualization.arrayToDataTable(graphData);
            drawChart(data);
            resolve(true);
        });
    });
}

sumSimilar = (array, elementKey) => {
    let sumArray = [];
    monthMap = getMonthMap();
    for(let i = 0; i < 60;){
        let count = 0;
        let element = [];
        date = array[i][elementKey];
        element.push(date);
        newDate = array[i][elementKey];
        
        while(newDate == date){
            count ++;
            i++;
            newDate = array[i][elementKey];
        };

        element.push(count);
        
        //Format date into mm/dd
        element[0] = formatDate(element[0], monthMap);

        sumArray.push(element);
    }
    return sumArray;
}

getMonthMap = () => {
    let monthToNum = new Map();
    const month = [
        'January', 'Feburary', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    for(let i = 1; i < month.length; i++){
        monthToNum.set(month[i], i);
    }
    return monthToNum;
}

formatDate = (dateTxt, monthMap) => {
    const regex = /([A-Z][a-z]*)([0-9]*)/i
    monthDay = dateTxt.match(regex)
    
    const month = monthMap.get(monthDay[1]);

    console.log(monthDay[1] + "/" + monthDay[2]);
    return (month + "/" + monthDay[2]);
}

// Draw the chart and set the chart values
function drawChart(data) {
    

    var options = {
        titlePosition: 'none',
        fontSize: 30,
        titleTextStyle: {
            color: '#B3A369',
            size: '100px'
        },
        legend: 'none',
        colors:  ['#B3A369'],
        bar: { groupWidth: "90%" },

        lineWidth: 10,
    };

    // Display the chart inside the <div> element with id="piechart"
    var chart = new google.visualization.ColumnChart(document.getElementById("graph"));
    chart.draw(data,(options));
}

