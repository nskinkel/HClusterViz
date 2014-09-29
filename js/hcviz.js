var margin = 20,
    diameter = 960;

var color = d3.scale.linear()
    .domain([-1, 5])
    .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    .interpolate(d3.interpolateHcl);

var pack = d3.layout.pack()
    .padding(2)
    .size([diameter - margin, diameter - margin])
    .value(function(d) { return d.size; })

var svg = d3.select("#clusterDiv").append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
  .append("g")
    .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

d3.json("data/topic.json", function(error, root) {
  if (error) return console.error(error);

  var focus = root,
      nodes = pack.nodes(root),
      view;

  var circle = svg.selectAll("circle")
      .data(nodes)
    .enter().append("circle")
      .attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
      .style("fill", function(d) { return d.children ? color(d.depth) : null; })
      .on("click", function(d) { 
            if (focus !== d) {
                zoom(d); 
                clearTable();
                refreshTable(d); 
                d3.event.stopPropagation(); 
            }
        });

  var text = svg.selectAll("text")
      .data(nodes)
    .enter().append("text")
      .attr("class", "label")
      .style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
      .style("display", function(d) { return d.parent === root ? null : "none"; })
      .text(function(d) { return d.name; });

  var insertLinebreaks = function (d) {
      var el = d3.select(this);
      var words = d.name.split(' ');
      el.text('');

	  el.append('tspan').text(words[0]).attr('x', 0).attr('dy', -15 * Math.floor(words.length / 2));
      for (var i = 1; i < words.length; i++) {
          var tspan = el.append('tspan').text(words[i]);
          tspan.attr('x', 0).attr('dy', '15');
      }
  };

  svg.selectAll("text").each(insertLinebreaks);

  var node = svg.selectAll("circle,text");

  d3.select("body")
      .style("background", color(-1))

  d3.select("#clusterDiv").on("click", function() { zoom(root); });

  zoomTo([root.x, root.y, root.r * 2 + margin]);

  function clearTable() {
    d3.select("table").selectAll("#dynamicCol").remove();
  }

  function refreshTable(d) {
    if (d.children === undefined) {
      for (var i = 0; i < d.tag.length; i++) {
        var j = d.tag[i];
      	var row = d3.select("#dataTable").append("tr");
        row.append("td").attr("id", "dynamicCol").text(j.name);
        row.append("td").attr("id", "dynamicCol").text(j.count);
      }
      return;
    }

    for (var i = 0; i < d.children.length; i++) {
      refreshTable(d.children[i]);
    }
  }

  function zoom(d) {
    var focus0 = focus; focus = d;

    var transition = d3.transition()
        .duration(d3.event.altKey ? 7500 : 750)
        .tween("zoom", function(d) {
          var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
          return function(t) { zoomTo(i(t)); };
        });

    transition.selectAll("text")
      .filter(function(d) { return showText(d, focus) || this.style.display === "inline"; })
        .style("fill-opacity", function(d) { return showText(d, focus) ? 1 : 0; })
        .each("start", function(d) { if (showText(d, focus)) this.style.display = "inline"; })
        .each("end", function(d) { if (!showText(d, focus)) this.style.display = "none"; });
  }

  function showText(d, focus) {
    return d.parent === focus || (d === focus && !d.children);
  }

  function zoomTo(v) {
    var k = diameter / v[2]; view = v;
    node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
    circle.attr("r", function(d) { return d.r * k; });
  }
});

d3.select(self.frameElement).style("height", diameter + "px");
