 var svg = d3.select("svg"),
    margin =  { top: 70, right: 20, bottom: 100, left: 150 },
    margin2 = {top: 420, right: 20, bottom: 40, left: 150},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    height2 = +svg.attr("height") - margin2.top - margin2.bottom;

 var parseDate = d3.utcParse("%d-%m-%y %H:%M:%S");

 var x = d3.scaleTime().range([0, width]),
    x2 = d3.scaleTime().range([0, width]),
   y = d3.scaleOrdinal() //create an ordinal scale for non numeric value
    .domain(["No obstacle", "Near blocked", "Middle blocked", "Far blocked"])
    .range([height, height * 2 / 3, height / 3, 0]);
    y2 = d3.scaleOrdinal().range(y.range());

 var xAxis = d3.axisBottom(x).ticks(7),
    xAxis2 = d3.axisBottom(x2).ticks(7),
    yAxis = d3.axisLeft(y); 

 var brush = d3.brushX()
    .extent([[0, 0], [width, height2]])
    .on("brush end", brushed);

 var zoom = d3.zoom()
    .scaleExtent([1, Infinity])
    .translateExtent([[0, 0], [width, height]])
    .extent([[0, 0], [width, height]])
    .on("zoom", zoomed);

 var area = d3.area()
    .curve(d3.curveMonotoneX)
    .x(function(d) { return x(d.Timestamp); })
    .y0(height)
    .y1(function(d) { return y(d['Laser Sensor Activation']);});

var area2 = d3.area()
    .curve(d3.curveMonotoneX)
    .x(function(d) { return x2(d.Timestamp); })
    .y0(height2)
    .y1(function(d) { return y2(d['Laser Sensor Activation']); });

svg.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

var focus = svg.append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var context = svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

  var initialDomain;  
  var dataset

  d3.csv("/static/diagnostic.csv", type, function(error, data){
    if (error) throw error;
    dataset=data

    //return 'Laser Sensor Activation' : d['Laser Sensor Activation'];

    initialDomain = d3.extent(data, function(d) { return d.Timestamp; });
    x.domain(initialDomain);
    //y.domain([0, d3.max(data, function(d) { return d['Laser Sensor Activation']; })]);
   // y2.domain([0, d3.max(data, function (d) {  console.log(d); return d['Laser Sensor Activation']; }) ]);
    
    x2.domain(x.domain());
    y2.domain(y.domain());

    focus.append("path")
      .datum(data)
      .attr("class", "area")
      .attr("d", area);

      svg.append("text")
        .attr("x", (width /1.8))             
        .attr("y", 50 - (margin.top/4))
        .attr("text-anchor", "middle")  
        .style("font-size", "23px") 
        .style("text-decoration", "underline")  
        .text("Laser Sensor vs Timestamp");

    focus.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    svg.append("text")             
      .attr("transform",
            "translate(" + (width/1.5) + " ," + 
                           (height + margin.top + 97) + ")")
      .style("text-anchor", "middle")
      .text("Timestamp ");


    focus.append("g")
      .attr("class", "axis axis--y")
      .call(yAxis);

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x",110 - (height /1.0))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Laser Sensor Output"); 

    context.append("path")
      .datum(data)
      .attr("class", "area")
      .attr("d", area2);

    context.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height2 + ")")
      .call(xAxis2);

    context.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, x.range());

    svg.append("rect")
      .attr("class", "zoom")
      .attr("width", width)
      .attr("height", height)
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .call(zoom);


      svg.append("g")     
      .attr("class", "grid")
      .attr("transform", "translate("+margin.left + "," + (height+ margin.top) + ")")
      .call(xgridlines()
          .tickSize(-1*(height))
          .tickFormat("")
      )

    svg.append("g")     
      .attr("class", "grid")
      .attr("transform", "translate("+margin.left + "," + (margin.top) + ")")
      .call(ygridlines()
          .tickSize(-width)
          .tickFormat("")
      )

    focus.append("circle")                                 
        .attr("class", "y")                                
        .style("fill", "none")                             
        .style("stroke", "blue")
        .attr("r", 4);  
        
  	focus.append("text").classed("label", true)
        .attr("x", 15)
        .attr("dy", ".31em");

                  
  	svg.append("rect")                                     
        .attr("width", width)                              
        .attr("height", height)                            
        .style("fill", "none")                             
        .style("pointer-events", "all")                    
        .on("mouseover", function() { 
          focus.style("display", null);  
        })
        .on("mouseout", function() { 
          focus.select("text.label").style("display","none");
        focus.selectAll("circle.y").style("display","none");
         })
        .on("mousemove", mousemove); 

});

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

function zoomed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
  var t = d3.event.transform;
  x.domain(t.rescaleX(x2).domain());
  focus.select(".area").attr("d", area);
  focus.select(".axis--x").call(xAxis);
  context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
}

function type(d) {
  d.Timestamp = parseDate(d.Timestamp);
  //d.Timestamp = d.Timestamp.valueOf();
  return d;
}

function transition(newRange) {
  var rgh = d3.timeHour.count(initialDomain[0], initialDomain[1]);
  var k = rgh/newRange;
  var t = d3.zoomIdentity.translate(0,0).scale(k);
  svg.transition()
      .call(zoom.transform, t);
}

 function xgridlines(){
    return d3.axisBottom(x).ticks(8)
  }

  function ygridlines(){
    return d3.axisLeft(y).ticks(10)
  }

  var bisectDate = d3.bisector(function(d) { return d.Timestamp; }).right;
 function mousemove() {  
   
   
        focus.select("text.label").style("display","block");
        focus.selectAll("circle.y").style("display","block");
        var x0 = x.invert(d3.mouse(focus.node())[0]),              
            i = bisectDate(dataset, x0, 1),                   
            d0 = dataset[i - 1],                              
            d1 = dataset[i];
            
        var d = x0 - d0.Timestamp > d1.Timestamp - x0 ? d1 : d0;     
        focus.select("text.label")
          .attr("x", x(d.Timestamp))
          .attr("y", y(d['Laser Sensor Activation'])-20)
          .attr('dy', -2)
          .attr("text-anchor", "middle")
          .text(function() { return "Timestamp :"+ d.Timestamp })
          .append('text:tspan')
          .attr("x", x(d.Timestamp))
          .attr("y", y(d['Laser Sensor Activation'])-20)
          .attr('dy', 12)
          .text(function() { return "Laser Sensor Output :"+ d['Laser Sensor Activation']; });


        focus.selectAll("circle.y")
             .attr("cx", x(d.Timestamp))
             .attr("cy", y(d['Laser Sensor Activation']));

    }  