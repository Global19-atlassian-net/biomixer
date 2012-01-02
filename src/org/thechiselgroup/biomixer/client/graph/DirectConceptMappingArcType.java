/*******************************************************************************
 * Copyright 2009, 2010 Lars Grammel 
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); 
 * you may not use this file except in compliance with the License. 
 * You may obtain a copy of the License at 
 *
 *    http://www.apache.org/licenses/LICENSE-2.0 
 *     
 * Unless required by applicable law or agreed to in writing, software 
 * distributed under the License is distributed on an "AS IS" BASIS, 
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
 * See the License for the specific language governing permissions and 
 * limitations under the License.  
 *******************************************************************************/
package org.thechiselgroup.biomixer.client.graph;

import org.thechiselgroup.biomixer.client.Concept;
import org.thechiselgroup.biomixer.client.Mapping;
import org.thechiselgroup.choosel.core.client.resources.Resource;
import org.thechiselgroup.choosel.core.client.resources.ResourceAccessor;
import org.thechiselgroup.choosel.core.client.resources.ResourceSet;
import org.thechiselgroup.choosel.core.client.util.collections.CollectionFactory;
import org.thechiselgroup.choosel.core.client.util.collections.LightweightCollection;
import org.thechiselgroup.choosel.core.client.util.collections.LightweightList;
import org.thechiselgroup.choosel.core.client.visualization.model.VisualItem;
import org.thechiselgroup.choosel.core.client.visualization.model.VisualItemContainer;
import org.thechiselgroup.choosel.visualization_component.graph.client.ArcType;
import org.thechiselgroup.choosel.visualization_component.graph.client.Graph;
import org.thechiselgroup.choosel.visualization_component.graph.client.widget.Arc;
import org.thechiselgroup.choosel.visualization_component.graph.client.widget.ArcSettings;

/**
 * Undirected arcs between concepts that are are mapped.
 * 
 * <p>
 * <b>IMPLEMENTATION NOTE</b>: The the order of source and target (and thus also
 * the id) depends on the lexicographical order of the URIs of the concepts.
 * That way, both concepts provide the same arc for the same mapping.
 * </p>
 * 
 * @author Lars Grammel
 */
public class DirectConceptMappingArcType implements ArcType {

    public static final String ID = "org.thechiselgroup.biomixer.client.graph.DirectConceptMappingArcType";

    public static final String ARC_COLOR = "#D4D4D4";

    public static final String ARC_STYLE = ArcSettings.ARC_STYLE_DASHED;

    public static final boolean ARC_DIRECTED = false;

    public static final int ARC_THICKNESS = 3;

    private final ResourceAccessor resourceAccessor;

    public DirectConceptMappingArcType(ResourceAccessor resourceAccessor) {
        this.resourceAccessor = resourceAccessor;
    }

    private Arc createArcItem(String concept1Uri, String concept2Uri) {
        boolean isConcept1First = concept1Uri.compareTo(concept2Uri) < 0;
        String firstUri = isConcept1First ? concept1Uri : concept2Uri;
        String secondUri = isConcept1First ? concept2Uri : concept1Uri;

        return new Arc(Graph.getArcId(ID, firstUri, secondUri), firstUri,
                secondUri, ID, ARC_DIRECTED);
    }

    @Override
    public LightweightCollection<Arc> getArcs(VisualItem visualItem,
            VisualItemContainer context) {

        LightweightList<Arc> arcItems = CollectionFactory
                .createLightweightList();

        // TODO clean up filter code
        if (visualItem.getId().startsWith(Concept.RESOURCE_URI_PREFIX)) {
            ResourceSet resources = visualItem.getResources();
            assert resources.size() == 1;
            Resource resource = resources.getFirstElement();

            for (String uri : resource
                    .getUriListValue(Concept.OUTGOING_MAPPINGS)) {
                if (resourceAccessor.contains(uri)) {
                    Resource mapping = resourceAccessor.getByUri(uri);
                    String targetResource = (String) mapping
                            .getValue(Mapping.TARGET);
                    arcItems.add(createArcItem(visualItem.getId(),
                            targetResource));
                }
            }
            for (String uri : resource
                    .getUriListValue(Concept.INCOMING_MAPPINGS)) {
                if (resourceAccessor.contains(uri)) {
                    Resource mapping = resourceAccessor.getByUri(uri);
                    String sourceResource = (String) mapping
                            .getValue(Mapping.SOURCE);
                    arcItems.add(createArcItem(sourceResource,
                            visualItem.getId()));
                }
            }
        }

        return arcItems;
    }

    @Override
    public String getArcTypeID() {
        return ID;
    }

    @Override
    public String getDefaultArcColor() {
        return ARC_COLOR;
    }

    @Override
    public String getDefaultArcStyle() {
        return ARC_STYLE;
    }

    @Override
    public int getDefaultArcThickness() {
        return ARC_THICKNESS;
    }
}