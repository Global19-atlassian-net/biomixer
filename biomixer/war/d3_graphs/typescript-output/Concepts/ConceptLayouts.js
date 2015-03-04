///<reference path="headers/require.d.ts" />
///<reference path="headers/d3.d.ts" />
define(["require", "exports", "../GraphView", "../Menu", "./ConceptGraph", "../JQueryExtension", "LayoutProvider", "GraphView", "Menu", "Concepts/ConceptPathsToRoot", "Concepts/ConceptGraph"], function(require, exports, GraphView, Menu, ConceptGraph) {
    var ConceptLayouts = (function () {
        function ConceptLayouts(forceLayout, graph, graphView, centralConceptUri) {
            this.forceLayout = forceLayout;
            this.graph = graph;
            this.graphView = graphView;
            this.centralConceptUri = centralConceptUri;
            /**
            * The fixed layout currently allows for storing of only a single layout, but interacts with undo/redo.
            */
            this.currentFixedLayoutData = {};
            this.lastTransition = null;
            this.staleTimerThreshold = 4000;
            this.desiredDuration = 500;
            this.lastRefreshArg = false;
        }
        ConceptLayouts.prototype.addMenuComponents = function (menuSelector) {
            // Add the butttons to the pop-out panel
            var layoutsContainer = $("<div>").attr("id", ConceptLayouts.layoutMenuContainerId);
            $(menuSelector).append(layoutsContainer);

            layoutsContainer.append($("<label>").addClass(Menu.Menu.menuLabelClass).text("Layouts"));
            layoutsContainer.append($("<br>"));

            var forceButton = $("<div>").attr("id", "forceLayoutButton").addClass("unselectable").addClass("layoutTextButton").append($("<div>").attr("id", "forceLayoutButtonIcon").css("float", "left").addClass("unselectable").addClass("iconLayoutButton").attr("title", "Force-Directed Layout")).append($("<div>").addClass("layoutText").text("Force"));

            var circleButton = $("<div>").attr("id", "circleLayoutButton").addClass("unselectable").addClass("layoutTextButton").append($("<div>").attr("id", "circleLayoutButtonIcon").css("float", "left").addClass("unselectable").addClass("iconLayoutButton").attr("title", "Circle Layout")).append($("<div>").addClass("layoutText").text("Circle"));

            var centerButton = $("<div>").attr("id", "centerLayoutButton").addClass("unselectable").addClass("layoutTextButton").append($("<div>").attr("id", "centerLayoutButtonIcon").css("float", "left").addClass("unselectable").addClass("iconLayoutButton").attr("title", "Center Layout")).append($("<div>").addClass("layoutText").text("Center"));

            var horizTreeButton = $("<div>").attr("id", "horizontalTreeLayoutButton").addClass("unselectable").addClass("layoutTextButton").append($("<div>").attr("id", "horizontalTreeLayoutButtonIcon").css("float", "left").addClass("unselectable").addClass("iconLayoutButton").attr("title", "Horizontal Tree Layout")).append($("<div>").addClass("layoutText").text("Horizontal"));

            var vertTreeButton = $("<div>").attr("id", "verticalTreeLayoutButton").addClass("unselectable").addClass("layoutTextButton").append($("<div>").attr("id", "verticalTreeLayoutButtonIcon").css("float", "left").addClass("unselectable").addClass("iconLayoutButton").attr("title", "Vertical Tree Layout")).append($("<div>").addClass("layoutText").text("Vertical"));

            var radialButton = $("<div>").attr("id", "radialLayoutButton").addClass("unselectable").addClass("layoutTextButton").append($("<div>").attr("id", "radialLayoutButtonIcon").css("float", "left").addClass("unselectable").addClass("iconLayoutButton").attr("title", "Radial Layout")).append($("<div>").addClass("layoutText").text("Radial"));

            var importButton = $("<input>").attr("id", "importedLayoutButton").addClass("nonIconLayoutButton").attr("type", "button").attr("value", "Imported Layout");

            var firstCol = $("<div>").css("float", "left");
            var secondCol = $("<div>").css("float", "left");
            var footer = $("<div>").css("clear", "both");
            layoutsContainer.append(firstCol);
            layoutsContainer.append(secondCol);
            layoutsContainer.append(footer);

            firstCol.append(centerButton);
            firstCol.append($("<br>"));
            firstCol.append(circleButton);
            firstCol.append($("<br>"));
            firstCol.append(forceButton);
            firstCol.append($("<br>"));
            firstCol.append(importButton);

            secondCol.append(vertTreeButton);
            secondCol.append($("<br>"));
            secondCol.append(horizTreeButton);
            secondCol.append($("<br>"));
            secondCol.append(radialButton);
            secondCol.append($("<br>"));

            d3.selectAll("#circleLayoutButton").on("click", this.applyNewLayoutLambda(this.runCircleLayoutLambda()));
            d3.selectAll("#forceLayoutButton").on("click", this.applyNewLayoutLambda(this.runForceLayoutLambda()));
            d3.selectAll("#centerLayoutButton").on("click", this.applyNewLayoutLambda(this.runCenterLayoutLambda()));
            d3.selectAll("#horizontalTreeLayoutButton").on("click", this.applyNewLayoutLambda(this.runHorizontalTreeLayoutLambda()));
            d3.selectAll("#verticalTreeLayoutButton").on("click", this.applyNewLayoutLambda(this.runVerticalTreeLayoutLambda()));
            d3.selectAll("#radialLayoutButton").on("click", this.applyNewLayoutLambda(this.runRadialLayoutLambda()));
            d3.selectAll("#importedLayoutButton").on("click", this.applyNewLayoutLambda(this.runFixedPositionLayoutLambda()));
            $("#importedLayoutButton").slideUp();
        };

        ConceptLayouts.prototype.getLayoutPositionSnapshot = function () {
            var positions = {};
            var graphNodes = this.graph.graphD3Format.nodes;
            $.each(graphNodes, function (index, node) {
                positions[String(node.nodeId)] = { x: node.x, y: node.y };
            });
            return positions;
        };

        ConceptLayouts.prototype.setLayoutFixedCoordinates = function (layout) {
            if (undefined == layout) {
                return;
            }
            this.currentFixedLayoutData = layout;
        };

        ConceptLayouts.prototype.applyFixedLayout = function () {
            this.runFixedPositionLayoutLambda()(false);
        };

        ConceptLayouts.prototype.applyNewLayoutLambda = function (layoutLambda) {
            var outerThis = this;
            return function () {
                outerThis.graphView.setCurrentLayout(layoutLambda);
                outerThis.graphView.runCurrentLayout();
            };
        };

        ConceptLayouts.prototype.setNewLayoutWithoutRunning = function (layoutLambda) {
            this.graphView.setCurrentLayout(layoutLambda);
        };

        ConceptLayouts.prototype.getLayoutRunner = function () {
            return this.graphView.currentLambda;
        };

        /**
        * If refresh, we use a timer to prevent stuttering.
        * If translateOnlyFixedNodes is true, then we have other nodes that will be unaffected
        * during the transition, probably because they are being animated in another way (such
        * as running a force layout concurrently that is meant to only apply to non-fixed nodes,
        * while we animate all of the fixed position nodes into their fixed positions).
        */
        ConceptLayouts.prototype.transitionNodes = function (refresh, transitionOnlyFixedNodes) {
            if (typeof transitionOnlyFixedNodes === "undefined") { transitionOnlyFixedNodes = false; }
            var outerThis = this;
            var graphNodes = outerThis.graph.graphD3Format.nodes;
            var graphLinks = outerThis.graph.graphD3Format.links;

            // This part is involved. To know if we have to smooth the time for the transition
            // as seen further down, we need to account for autoamtic layout refreshes and manual
            // triggers separately. In particular, we have to treat the first refresh in a series
            // of automatic refreshes as special and essentially equivalent to a manual non-refreshing
            // layout triggered by the user. Like I said, involved.
            var allowForDurationAdjustment = false;
            if (refresh === false) {
                // For non-refreshign manual layout triggers, do not allow time adjustment,
                // always use the maximal transition animation duration.
                this.lastRefreshArg = false;
            } else if (refresh === true) {
                // First refresh in series does not allow for time adjustment, subsequent do.
                allowForDurationAdjustment = this.lastRefreshArg;
                this.lastRefreshArg = true;
            }

            var now = new Date().getTime();

            // When the graph is still growing, calls to the layout occur. This causes
            // a stuttering of movement if we do transitions, and without, the node
            // teleportation is confusing.
            // So, when we are refreshing a layout (node/edge addition), we need the
            // layout duration to continue along the path it was on. This *might* backfire
            // when we have an extremely long set of node or edge additions though.
            // If so, try having a minimum transition duration.
            var reduceDurationBy = 0;
            if (null !== this.lastTransition && allowForDurationAdjustment && (now - this.lastTransition) <= this.staleTimerThreshold) {
                reduceDurationBy = now - this.lastTransition;
                // console.log("SHORTEN! By: "+reduceDurationBy);
            }
            var duration = this.desiredDuration - reduceDurationBy;

            // The filtering we do on these is required due to delays in removal caused by animation of node removal.
            // Before I added the D3 transition to the node removal function, this worked fine, but it throws errors
            // when the selection with a runnign transition suddenly loses members.
            d3.selectAll("g.node_g").filter(function (node, i) {
                return transitionOnlyFixedNodes ? node.fixed : true;
            }).filter(function (node, i) {
                return null !== outerThis.graph.containsNode(node);
            }).transition().duration(duration).ease("linear").attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

            // NB If we are doing translateOnlyFixedNodes, will transitioning unfixed arcs break things?
            d3.selectAll(GraphView.BaseGraphView.linkSvgClass).filter(function (link, i) {
                return null !== outerThis.graph.containsNodeById(link.sourceId) && null !== outerThis.graph.containsNodeById(link.targetId) && null !== link.source && null !== link.target;
            }).transition().duration(duration).ease("linear").attr("points", outerThis.graphView.updateArcLineFunc);

            d3.selectAll(GraphView.BaseGraphView.linkMarkerSvgClass).filter(function (link, i) {
                return null !== outerThis.graph.containsNodeById(link.sourceId) && null !== outerThis.graph.containsNodeById(link.targetId) && null !== link.source && null !== link.target;
            }).transition().duration(duration).ease("linear").attr("points", outerThis.graphView.updateArcMarkerFunc);

            if (this.lastTransition === null || !refresh || (now - this.lastTransition) > this.staleTimerThreshold) {
                this.lastTransition = new Date().getTime();
            }
        };

        ConceptLayouts.prototype.getAllOntologyAcronyms = function () {
            var ontologies = [];
            var outerThis = this;
            var graphNodes = outerThis.graph.graphD3Format.nodes;
            graphNodes.forEach(function (node) {
                if ($.inArray(node.ontologyAcronym, ontologies) === -1) {
                    ontologies.push(node.ontologyAcronym);
                }
            });

            return ontologies;
        };

        ConceptLayouts.prototype.getChildren = function (parentNode, graphLinks) {
            var outerThis = this;
            var graphNodes = outerThis.graph.graphD3Format.nodes;

            //        var graphLinks = outerThis.graph.graphD3Format.links;
            var children = [];

            graphLinks.forEach(function (link) {
                if (link.sourceId == parentNode.nodeId && link.relationType != "maps_to") {
                    graphNodes.forEach(function (node) {
                        if (node.nodeId == link.targetId && $.inArray(node, children) === -1) {
                            children.push(node);
                        }
                    });
                }
            });

            return children;
        };

        ConceptLayouts.prototype.calculateDepth = function (parentNode, depth, graphLinks) {
            var outerThis = this;

            var children = outerThis.getChildren(parentNode, graphLinks);

            //            .filter(function(c){
            //            return !($.inArray(parentNode, outerThis.getChildren(c)) != -1);
            //        });
            //console.log(children);
            if (children.length <= 0) {
                return depth;
            } else {
                children.forEach(function (child) {
                    if (child.tempDepth <= parentNode.tempDepth) {
                        child.tempDepth = parentNode.tempDepth + 1;
                    }
                    if (child.tempDepth > depth) {
                        depth++;
                    }
                    depth = outerThis.calculateDepth(child, depth, graphLinks);
                });
                return depth;
            }
        };

        ConceptLayouts.prototype.getRoots = function (ontologyAcronym, graphLinks) {
            var outerThis = this;
            var graphNodes = outerThis.graph.graphD3Format.nodes;

            //        var graphLinks = outerThis.graph.graphD3Format.links;
            var roots = [];
            var isRoot = true;
            var graphLinks = graphLinks.filter(function (l) {
                return l.relationType != "maps_to";
            });
            graphNodes = graphNodes.filter(function (n) {
                return n.ontologyAcronym == ontologyAcronym;
            });
            graphNodes.forEach(function (node) {
                graphLinks.forEach(function (link) {
                    if (link.targetId === node.nodeId) {
                        isRoot = false;
                    }
                });
                if (isRoot) {
                    roots.push(node);
                }

                isRoot = true;
            });
            return roots;
        };

        ConceptLayouts.prototype.buildTree = function (width, height) {
            var outerThis = this;
            var graphNodes = outerThis.graph.graphD3Format.nodes;
            var graphLinks = outerThis.graph.graphD3Format.links;
            var ontologies = outerThis.getAllOntologyAcronyms();

            //reset values for next layout
            graphNodes.forEach(function (node) {
                node.tempDepth = 0;
                node.depth = 0;
                node.x = 0;
                node.y = 0;
                node.children = null;
                node.parent = null;
            });

            var tempGraphLinks = [];

            graphLinks.forEach(function (link) {
                var cycleLink = false;
                tempGraphLinks.forEach(function (tempLink) {
                    if ((link.sourceId == tempLink.targetId && link.targetId == tempLink.sourceId)) {
                        cycleLink = true;
                    }
                });

                if (!cycleLink)
                    tempGraphLinks.push(link);
            });

            var fullTreeDepth = 0;

            var primaryRoot = new ConceptGraph.Node();
            primaryRoot.name = "main_phantom_root"; //temporary identifier for the root

            var ontologyRoots = [];

            //create ontology roots
            ontologies.forEach(function (ontologyName) {
                var ontologyRoot = new ConceptGraph.Node();
                ontologyRoot.name = ontologyName;
                ontologyRoots.push(ontologyRoot);
                var roots;

                roots = outerThis.getRoots(ontologyName, tempGraphLinks);

                roots.forEach(function (root) {
                    var ontologyDepth = outerThis.calculateDepth(root, 0, tempGraphLinks);
                    if (ontologyDepth > fullTreeDepth) {
                        fullTreeDepth = ontologyDepth;
                    }
                });
            });

            var allChildren = [];

            //calculate tree height and adjust for phantom nodes
            var oldHeight = height;
            height = height * (fullTreeDepth + 2) / (fullTreeDepth);

            var mainTree = d3.layout.tree().size([width, height]).children(function (parent) {
                if (parent.name == "main_phantom_root") {
                    return ontologyRoots;
                } else if ($.inArray(parent.name, ontologies) != -1) {
                    var roots;
                    roots = outerThis.getRoots(parent.name, tempGraphLinks);

                    roots.forEach(function (root) {
                        if ($.inArray(root, allChildren) === -1) {
                            allChildren.push(root);
                        }
                    });

                    return roots;
                } else {
                    var graphChildren = outerThis.getChildren(parent, tempGraphLinks);
                    var treeChildren = [];

                    graphChildren = graphChildren.sort(function (a, b) {
                        if (a.nodeId > b.nodeId) {
                            return -1;
                        } else if (a.nodeId < b.nodeId) {
                            return 1;
                        } else {
                            return 0;
                        }
                    });

                    graphChildren.forEach(function (child) {
                        if (child.tempDepth === parent.tempDepth + 1 && $.inArray(child, allChildren) === -1) {
                            treeChildren.push(child);
                            allChildren.push(child);
                        }
                    });
                    return treeChildren;
                }
            });

            mainTree.nodes(primaryRoot);

            // shift the tree by 2 node distances
            graphNodes.forEach(function (node) {
                node.y = node.y - 2 / (fullTreeDepth + 2) * height;
            });
        };

        ConceptLayouts.prototype.runRadialLayoutLambda = function () {
            var outerThis = this;
            return function (refreshLayout) {
                if (refreshLayout) {
                    // Act normal, redo the whole layout
                }

                outerThis.forceLayout.stop();
                var graphNodes = outerThis.graph.graphD3Format.nodes;

                var ontologies = outerThis.getAllOntologyAcronyms();

                var tempGraphLinks = [];
                var graphLinks = outerThis.graph.graphD3Format.links;

                graphLinks.forEach(function (link) {
                    var cycleLink = false;
                    tempGraphLinks.forEach(function (tempLink) {
                        if ((link.sourceId == tempLink.targetId && link.targetId == tempLink.sourceId)) {
                            cycleLink = true;
                        }
                    });

                    if (!cycleLink)
                        tempGraphLinks.push(link);
                });

                var numOfRoots = 0;
                ontologies.forEach(function (o) {
                    var roots = outerThis.getRoots(o, tempGraphLinks);
                    numOfRoots += roots.length;
                });
                console.log(numOfRoots);

                var minShift = 100;
                var maxShift = outerThis.graphView.visHeight() / 2 - 100;
                var yShift = numOfRoots * 20;

                if (yShift < minShift) {
                    yShift = minShift;
                }
                if (yShift > maxShift) {
                    yShift = maxShift;
                }

                var treeWidth = 360;
                var treeHeight = (outerThis.graphView.visHeight() - yShift - 100) / 2;

                outerThis.buildTree(treeWidth, treeHeight);

                $.each(graphNodes, function (index, element) {
                    var radius = element.y + yShift / 2;
                    var angle = (element.x) / 180 * Math.PI;
                    graphNodes[index].x = outerThis.graphView.visWidth() / 2 + radius * Math.cos(angle);
                    graphNodes[index].y = outerThis.graphView.visHeight() / 2 + radius * Math.sin(angle);
                });
                outerThis.transitionNodes(refreshLayout);
            };
        };

        ConceptLayouts.prototype.runVerticalTreeLayoutLambda = function () {
            var outerThis = this;
            return function (refreshLayout) {
                if (refreshLayout) {
                    // Act normal, redo the whole layout
                }

                outerThis.forceLayout.stop();
                var graphNodes = outerThis.graph.graphD3Format.nodes;

                var xShift = 100;
                var yShift = 200;
                var treeWidth = outerThis.graphView.visWidth() - xShift;
                var treeHeight = outerThis.graphView.visHeight() - yShift;

                outerThis.buildTree(treeWidth, treeHeight);

                $.each(graphNodes, function (index, element) {
                    graphNodes[index].x = element.x + xShift / 2;
                    graphNodes[index].y = element.y + yShift / 2;
                });

                outerThis.transitionNodes(refreshLayout);
            };
        };

        ConceptLayouts.prototype.runHorizontalTreeLayoutLambda = function () {
            var outerThis = this;
            return function (refreshLayout) {
                if (refreshLayout) {
                    // Act normal, redo the whole layout
                }

                outerThis.forceLayout.stop();
                var graphNodes = outerThis.graph.graphD3Format.nodes;

                var xShift = 300;
                var yShift = 100;
                var treeWidth = outerThis.graphView.visHeight() - yShift;
                var treeHeight = outerThis.graphView.visWidth() - xShift;

                outerThis.buildTree(treeWidth, treeHeight);

                $.each(graphNodes, function (index, element) {
                    var xValue = element.x;
                    graphNodes[index].x = element.y + xShift / 2;
                    graphNodes[index].y = xValue + yShift / 2;
                });

                outerThis.transitionNodes(refreshLayout);
            };
        };

        ConceptLayouts.prototype.runCircleLayoutLambda = function () {
            var outerThis = this;
            return function (refreshLayout) {
                if (refreshLayout) {
                    // Act normal, redo the whole layout
                }

                outerThis.forceLayout.stop();
                var graphNodes = outerThis.graph.graphD3Format.nodes;
                var graphLinks = outerThis.graph.graphD3Format.links;

                var numberOfConcepts = Object.keys(graphNodes).length;

                var anglePerNode = 2 * Math.PI / numberOfConcepts;
                var arcLength = outerThis.graphView.linkMaxDesiredLength();
                var i = 0;

                $.each(graphNodes, function (index, element) {
                    var angleForNode = i * anglePerNode;
                    i++;
                    graphNodes[index].x = outerThis.graphView.visWidth() / 2 + arcLength * Math.cos(angleForNode); // start in middle and let them fly outward
                    graphNodes[index].y = outerThis.graphView.visHeight() / 2 + arcLength * Math.sin(angleForNode); // start in middle and let them fly outward
                });

                outerThis.transitionNodes(refreshLayout);
            };
        };

        ConceptLayouts.prototype.runCenterLayoutLambda = function () {
            var outerThis = this;
            return function (refreshLayout) {
                if (refreshLayout) {
                    // Act normal, redo the whole layout
                }

                outerThis.forceLayout.stop();
                var graphNodes = outerThis.graph.graphD3Format.nodes;
                var graphLinks = outerThis.graph.graphD3Format.links;

                var numberOfConcepts = Object.keys(graphNodes).length - 1;

                var anglePerNode = 2 * Math.PI / numberOfConcepts;
                var arcLength = outerThis.graphView.linkMaxDesiredLength();
                var i = 0;

                $.each(graphNodes, function (index, node) {
                    if (node.nodeId != outerThis.centralConceptUri) {
                        var angleForNode = i * anglePerNode;
                        i++;
                        node.x = outerThis.graphView.visWidth() / 2 + arcLength * Math.cos(angleForNode); // start in middle and let them fly outward
                        node.y = outerThis.graphView.visHeight() / 2 + arcLength * Math.sin(angleForNode); // start in middle and let them fly outward
                    } else {
                        node.x = outerThis.graphView.visWidth() / 2;
                        node.y = outerThis.graphView.visHeight() / 2;
                        //alert(node.id+centralConceptUri);
                    }
                });
                outerThis.transitionNodes(refreshLayout);
            };
        };

        ConceptLayouts.prototype.runForceLayoutLambda = function () {
            var outerThis = this;
            return function (refreshLayout) {
                if (refreshLayout) {
                    // If we add a node to force layout, reheat it slightly
                    outerThis.forceLayout.resume();
                    return;
                }

                var graphNodes = outerThis.graph.graphD3Format.nodes;

                // The nodes may have been fixed in the fixed layout, or when dragging them.
                // If we are not merely refreshing, let them all be free to move.
                $.each(graphNodes, function (index, node) {
                    node.fixed = false;
                });

                outerThis.forceLayout.friction(0.3).gravity(0.05).linkStrength(0.1).charge(-800);

                outerThis.forceLayout.on("tick", outerThis.graphView.onLayoutTick());
                outerThis.forceLayout.start();
            };
        };

        ConceptLayouts.prototype.runFixedPositionLayoutLambda = function () {
            var outerThis = this;
            return function (refreshLayout) {
                if (refreshLayout) {
                    // Act normal, redo the whole layout
                }

                outerThis.forceLayout.stop();
                var graphNodes = outerThis.graph.graphD3Format.nodes;

                $.each(graphNodes, function (index, node) {
                    if (undefined !== outerThis.currentFixedLayoutData[String(node.nodeId)]) {
                        node.x = outerThis.currentFixedLayoutData[String(node.nodeId)].x;
                        node.y = outerThis.currentFixedLayoutData[String(node.nodeId)].y;
                        node.fixed = true;
                    } else {
                        // Use whatever position is on the node already? Assign a random position??
                        // If using previous position, then shall we use a circle layout to do so (quite quick)?
                        // No, we will run the force layout while keeping all the nodes herein fixed!
                    }
                });

                // The transition is needed for the fixed positions, but not the force layout ones...
                outerThis.transitionNodes(refreshLayout, true);
            };
        };

        ConceptLayouts.prototype.updateFixedLayoutDatum = function (nodeId, coordinates) {
            this.currentFixedLayoutData[String(nodeId)] = coordinates;
            $("#importedLayoutButton").slideDown();
        };

        ConceptLayouts.prototype.updateFixedLayoutData = function (newPositions) {
            for (var nodeId in newPositions) {
                this.currentFixedLayoutData[nodeId] = newPositions[nodeId];
            }

            if (this.currentFixedLayoutData !== undefined) {
                $("#importedLayoutButton").slideDown();
            } else {
                $("#importedLayoutButton").slideUp();
            }
        };
        ConceptLayouts.layoutMenuContainerId = "layoutMenuContainer";
        return ConceptLayouts;
    })();
    exports.ConceptLayouts = ConceptLayouts;
});
