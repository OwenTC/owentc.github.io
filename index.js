class Graph {
   constructor(adjacencyList) {
      this.adjacencyList = adjacencyList;
    }

   addVertex(vertex) {
     if (!this.adjacencyList[vertex]) {
       this.adjacencyList[vertex] = [];
     }
   }
   addVertices(vertices) {
      for (let i = 0; i < vertices.length; i++){
         this.addVertex(vertices[i])
      }
   }
   addEdge(source, destination) {
     if (!this.adjacencyList[source]) {
       this.addVertex(source);
     }
     if (!this.adjacencyList[destination]) {
       this.addVertex(destination);
     }
     this.adjacencyList[source].push(destination);
     this.adjacencyList[destination].push(source);
   }
   addEdges(edges) {
      for (let i = 0; i < edges.length; i++){
         this.addEdge(edges[i][0],edges[i][1])
      }
   }
   removeEdge(source, destination) {
     this.adjacencyList[source] = this.adjacencyList[source].filter(vertex => vertex !== destination);
     this.adjacencyList[destination] = this.adjacencyList[destination].filter(vertex => vertex !== source);
   }
   removeVertex(vertex) {
     while (this.adjacencyList[vertex].length) {
       const adjacentVertex = this.adjacencyList[vertex].pop();
       this.removeEdge(vertex, adjacentVertex);
     }
     delete this.adjacencyList[vertex];
   }
   getNeighbors(vertex){
      return this.adjacencyList[vertex];
   }
   
   get_adj_list(){
      return this.adjacencyList
   }
}

class SoundGraph extends Graph {
   constructor(adj_list, graph_num) {
      super(adj_list)
      this.graph_num = 0
      // this.audio_map = this.generateAudios(note_map);
   }
   setGraphNum(i){
      this.graph_num = i
   }
   generateAudios(note_map){
      let audio_map = {}
      for (const v of Object.keys(note_map)) {
         audio_map[v] = document.querySelector(`audio[note="${note_map[v]}"]`);
      }
      console.log(audio_map);
      return audio_map;
   }

   sigmoid(x){
      return 440*((2^(1/12))^(40-(x+39)))
   }

   playGraphSong(vertices,steps,tempo,cyto_graph) {
      let beat_time = 60 / tempo
      let active_vertices = vertices;
      for (let i = 0; i < steps; i++){
         let next_vertices = new Set();
         
         for (const v of active_vertices.values()) {
            let neighbors = this.getNeighbors(v);
            for (const n of neighbors) {
               if (!next_vertices.has(n)) {
                  next_vertices.add(n);
               }
            }
            this.play(150*(v), beat_time*(i));
            setTimeout(function(){this.colorCytoGraph(v, (beat_time*1000),cyto_graph);}.bind(this), ((beat_time*1000)*(i)));
            // setTimeout(function(){ this.playVertexSound(v); }, (500*(steps-i)));  
         }
         active_vertices = next_vertices;
         console.log(active_vertices)
      }
      return true
   }

   colorCytoGraph(v, time, cy) {
      let id = `g${this.graph_num}v${v}`
      let node = cy.$id(id);
      node.data("weight", 1);

      setTimeout(function(){node.data("weight", 0);}, time*(0.8), v, cy);
      return true;
   }

   // playVertexSound(vertex) {
   //    console.log(vertex);
   //    // this.audio_map[(1+vertex%12)].currentTime = 0;
   //    // this.audio_map[(1+vertex%12)].play();
   //    var midi = this.keydict.at(vertex+60);
   //    this.play(1175,)
   // }

   play(frequency, time) {
      console.log("PLAYING", frequency, time)
      var context = new AudioContext()
      var o = context.createOscillator()
      o.type = "triangle"
      var g = context.createGain();
      o.connect(g);
      g.connect(context.destination);
      g.gain.exponentialRampToValueAtTime(
        0.00001, context.currentTime + .3 + time
      );
      o.frequency.value = frequency;
      o.start(time);
   }
}

function sound_graph_to_cy (sound_graph, graph_key, cy) {
   console.log(sound_graph)
   const adj_list = sound_graph.get_adj_list();
   console.log(adj_list);
   //Add vertices
   for (const v of Object.keys(adj_list)) {
      cy.add({
         data: { id: `g${graph_key}v${v}`, weight:0, graph_key:graph_key}
         }
      );
   }
   console.log(cy.json())

   //Add edges
   for (const v of Object.keys(adj_list)) {
      for (const u of adj_list[v]) {
         cy.add({
            data: {
               id: ('edge' + "g" + graph_key + "v" + v) + u,
               source: `g${graph_key}v${v}`,
               target: `g${graph_key}v${u}`
            }
         });
      }   
   }

   //Layout
   cy.layout({
      name: 'cose',
      animate: false,
      nodeRepulsion: function( node ){ return 100000048; },

   }).run();
}

function add_sound_graphs_to_cy(graphs, cy){
   //Remove edges
   cy.remove(cy.elements('node'));
   for (i = 0; i < graphs.length; i++) {
      graphs[i].setGraphNum(i)
      sound_graph_to_cy(graphs[i], i, cy)
   }
}

let adj_list_2 = {1:[2,3],2:[4],3:[2],4:[3,1]};
let adj_list_1 = {1:[2],2:[3],3:[4],4:[5],5:[6],6:[7],7:[1]};
let adj_list_5 = {1:[6],2:[3],3:[2,11],4:[5,11],5:[4,10],6:[2],7:[11],8:[7],9:[8],10:[9],11:[5]};
let adj_list_4 = {5:[4],4:[12],12:[2,7],7:[5],2:[1],1:[4]};
let adj_list_3 = 
{
   1:[2,3,4],
   2:[9,5],
   3:[7,8],
   4:[10],
   5:[6],
   6:[7],
   7:[9],
   8:[5],
   9:[10],
   10:[8]
} //Peterson Graph!

sound_graphs = [new SoundGraph(adj_list_1), new SoundGraph(adj_list_2),new SoundGraph(adj_list_3), new SoundGraph(adj_list_4), new SoundGraph(adj_list_5)];

var cy = cytoscape({
   container: document.getElementById('cy'),
   style:
   cytoscape.stylesheet()
      .selector('node')
         .style({
         'background-color': 'mapData(weight, 0, 1, grey, orange)'
      })
      .selector('edge')
         .style({
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'width': "10%"
         })
});

add_sound_graphs_to_cy(sound_graphs, cy);

tempo = 140
steps = 10
start_vertex = new Set([1])

document.getElementById('run_1').addEventListener("click", function(){sound_graphs[0].playGraphSong(start_vertex,steps,tempo,cy)});
document.getElementById('run_2').addEventListener("click", function(){sound_graphs[1].playGraphSong(start_vertex,steps,tempo,cy)});
document.getElementById('run_3').addEventListener("click", function(){sound_graphs[2].playGraphSong(start_vertex,steps,tempo,cy)});
document.getElementById('run_4').addEventListener("click", function(){sound_graphs[3].playGraphSong(start_vertex,steps,tempo,cy)});
document.getElementById('run_5').addEventListener("click", function(){sound_graphs[4].playGraphSong(start_vertex,steps,tempo,cy)});

