
//set the width and height of the graph
//for main graph and the small graph
var svg = d3.select("svg"),
    margin =  {top:  70, right: 20, bottom: 100, left: 80},
    margin2 = {top: 442, right: 20, bottom: 40,  left: 80},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    height2 = +svg.attr("height") - margin2.top - margin2.bottom;

 var parseDate = d3.utcParse("%d-%m-%y %H:%M:%S");
 //scaletime to automatic GMT
 
 //create linear scale for time (scaleTime)
 //create quantitative linear scale (scaleLinear)
 var x = d3.scaleTime().range([0,width]), 
    x2 = d3.scaleTime().range([0,width]),
     y = d3.scaleLinear().range([height,0]),
    y2 = d3.scaleLinear().range([height2,0]);

 //set the axis position bottom and left oriented 
 var xAxis = d3.axisBottom(x).ticks(7), //generate representative values from a numeric interval.
    xAxis2 = d3.axisBottom(x2).ticks(7),
     yAxis = d3.axisLeft(y);
 
 // create a brush along the x-dimension.
 var brush = d3.brushX()
    .extent([[0, 0], [width, height2]])
    .on("brush end", brushed);

 //set the zoom on main graph
 var zoom = d3.zoom()
    .scaleExtent([1, Infinity])
    .translateExtent([[0, 0], [width, height]])
    .extent([[0, 0], [width, height]])
    .on("zoom", zoomed);

//set the area of the main graph
 var area = d3.area()
    .curve(d3.curveMonotoneX)
    .x(function(d) { return x(d.Timestamp); })
    .y0(height)
    .y1(function(d) { return y(d['AGV Mileage']);});

//set the area of the small graph
var area2 = d3.area()
    .curve(d3.curveMonotoneX)
    .x(function(d) { return x2(d.Timestamp); })
    .y0(height2)
    .y1(function(d) { return y2(d['AGV Mileage']); });

svg.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

//declare focus
var focus = svg.append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//declare context
var context = svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");


  var initialDomain;
  var ydomain;

  
  var dataset 

      $(document).ready(function(){
        var x = $.ajax({
                     url:"http://rnd.dfautomation.com:8806/system/diagnostics/data",type:"GET",
                     dataType:"text",
                     success:function(result){
                          console.log(result);
                          console.log(x.getAllResponseHeaders());
                       },
        error:function(result){
                          console.log(x.getAllResponseHeaders());
                      }
       }); 
    });
    
  
  d3.csv("/static/diagnostic.csv", type, function(error, data) { //static csv file

  //d3.csv(x, type, function(error, data) { (1.first way : read url real time data using ajax)
  //d3.csv("{% url 'system:data' %}", type, function(error, data){ (2. second way: read real time from diagnostic function)
  //d3.csv("http://rnd.dfautomation.com:8806/system/diagnostics/data", function(data) { (3.third way : straight read data from url)
   //data.forEach(function(d) {
   //     d.Timestamp = parseDate(d.Timestamp);
   //     d['AGV Mileage'] = +d['AGV Mileage'];
   //                         });
  if (error) throw error ;
  console.log(data);
  dataset = data
  
  initialDomain = d3.extent(data, function(d) { return d.Timestamp; }); // variable for timestamp column's value from start to end
  x.domain(initialDomain); // main x-axis domain (timestamp variable)
  ydomain = d3.extent(data, function(d) { return d['AGV Mileage']; }); // variable for agv mileage column's value from start to end
  y.domain(ydomain); // main y-axis domian (agv mileage variable)
  x2.domain(x.domain()); // the small x-axis has the same domain as main x-axis  
  y2.domain(y.domain()); // the small y-axis has the same domain as y-axis
  
  focus.append("path")    
      .datum(data)
      .attr("class", "area")
      .attr("d", area)

  //set the text and attribute for graph title 
  svg.append("text")
        .attr("x", (width /1.8))             
        .attr("y", 50 - (margin.top/4))
        .attr("text-anchor", "middle")  
        .style("font-size", "23px") 
        .style("text-decoration", "underline")  
        .text("AGV Mileage vs Timestamp");

  //align xaxis and x2axis
  focus.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  //set the text and attribute for x-axis
  svg.append("text")             
      .attr("transform",
            "translate(" + (width/1.8) + " ," + 
                           (height + margin.top + 96) + ")")
      .style("text-anchor", "middle")
      .text("Timestamp ");
  
  //align yaxis and y2axis
  focus.append("g")
      .attr("class", "axis axis--y")
      .call(yAxis);
   
   //set the text and attribute for y-axis
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x",0 - (height / 1.8))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("AGV Mileage ( mm ) ");  
  
  //area for small graph
  context.append("path")
      .datum(data)
      .attr("class", "area")
      .attr("d", area2);
      

  context.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height2 + ")")
      .call(xAxis2);

  //brush move the graph,
  context.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, x.range()); //move the brush selection fpr x range.
  
  // zoom within the graph area
  svg.append("rect")
      .attr("class", "zoom")
      .attr("width", width)
      .attr("height", height)
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .call(zoom);
  
  //set line for xaxis gridline
  svg.append("g")     
      .attr("class", "grid")
      .attr("transform", "translate("+margin.left + "," + (height+ margin.top) + ")")
      .call(xgridlines()
          .tickSize(-1*(height))
          .tickFormat("")
      )

  //set line for yaxis gridline
  svg.append("g")     
      .attr("class", "grid")
      .attr("transform", "translate("+margin.left + "," + (margin.top) + ")")
      .call(ygridlines()
          .tickSize(-width)
          .tickFormat("")
      )
  
  //attribute of the tooltip circle 
  focus.append("circle")                                 
        .attr("class", "y")                                
        .style("fill", "none")                             
        .style("stroke", "blue")
        .attr("r", 4);  
        
  //attribute of the tooltip text      
  focus.append("text").classed("label", true)
        .attr("x", 15)
        .attr("dy", ".31em");

  //1..declare the mouse function on the graph area ( width & height)
  //2..mouse within the graph area will shows the tooltip value
  //3..mouse outside the graph area then the tooltip will disappear                
  svg.append("rect")                                     
        .attr("width", width)                              
        .attr("height", height)                            
        .style("fill", "none")                             
        .style("pointer-events", "all")                    
        .on("mouseover", function() {  //2..
          focus.style("display", null);  
        })
        .on("mouseout", function() { //3..
          focus.select("text.label").style("display","none");
        focus.selectAll("circle.y").style("display","none");
         })
        .on("mousemove", mousemove); 
});

// brush function when brush the graph, the x-domain of x-graph will focus on the x-domain
//of small graph
function brushed() { 
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
  var s = d3.event.selection || x2.range();
  x.domain(s.map(x2.invert, x2));
  focus.select(".area").attr("d", area);
  focus.select(".axis--x").call(xAxis);
  svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
      .scale(width / (s[1] - s[0]))
      .translate(-s[0], 0));
}

// zoom function for main graph when small graph is brushed
function zoomed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
  var t = d3.event.transform;
  x.domain(t.rescaleX(x2).domain());
  focus.select(".area").attr("d", area);
  focus.select(".axis--x").call(xAxis);
  context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
}

//declare d
function type(d) {
  d.Timestamp = parseDate(d.Timestamp);
  //d.Timestamp = d.Timestamp.valueOf();
  d['AGV Mileage'] = +d['AGV Mileage'];
  return d;
}

//time transition function
function transition(newRange) {
  var rgh = d3.timeHour.count(initialDomain[0], initialDomain[1]); //count the total hours
  var k = rgh/newRange; //find k dividing rgh by newRange and perform transformation on the graph
  var t = d3.zoomIdentity.translate(0,0).scale(k);
  svg.transition()
      .call(zoom.transform, t);
}

 // number of x-grid line
 function xgridlines(){
    return d3.axisBottom(x).ticks(8)
  }

  // number of y-grid line
  function ygridlines(){
    return d3.axisLeft(y).ticks(10)
  }


//define the bisectDate function and set the cx and cy attributes of the circle 
//to make circle move.
var bisectDate = d3.bisector(function(d) { return d.Timestamp; }).right;
 function mousemove() {  
   
   
        focus.select("text.label").style("display","block");
        focus.selectAll("circle.y").style("display","block");

        //get the mouse position relative to a given container of graph.
        var x0 = x.invert(d3.mouse(focus.node())[0]),              
            i = bisectDate(dataset, x0, 1),                   
            d0 = dataset[i - 1],                              
            d1 = dataset[i];
            
        var d = x0 - d0.Timestamp > d1.Timestamp - x0 ? d1 : d0;    

        // for the tooltip to show value
        // adjust the attribute the text
        focus.select("text.label")
          .attr("x", x(d.Timestamp))
          .attr("y", y(d['AGV Mileage'])-20)
          .attr('dy', -2)
          .attr("text-anchor", "middle")
          .text(function() { return "Timestamp :"+ d.Timestamp })
          .append('text:tspan')
          .attr("x", x(d.Timestamp))
          .attr("y", y(d['AGV Mileage'])-20)
          .attr('dy', 12)
          .text(function() { return "AGV Mileage :"+ d['AGV Mileage']; });


        focus.selectAll("circle.y")
             .attr("cx", x(d.Timestamp))
             .attr("cy", y(d['AGV Mileage']));

    }                                             
