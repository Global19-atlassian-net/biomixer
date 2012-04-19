/*******************************************************************************
 * Copyright 2012 David Rusk
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
package org.thechiselgroup.biomixer.client.services.ontology;

import static org.hamcrest.CoreMatchers.equalTo;
import static org.junit.Assert.assertThat;

import java.io.IOException;

import org.junit.Before;
import org.junit.Test;
import org.thechiselgroup.biomixer.server.core.util.IOUtils;
import org.thechiselgroup.biomixer.server.workbench.util.json.JavaJsonParser;

public class OntologyNameJsonParserTest {

    private OntologyNameJsonParser underTest;

    @Test
    public void getOntologyName() throws IOException {
        String ontologyName = parseOntologyName("ontology_name.json");
        assertThat(ontologyName, equalTo("Body System"));
    }

    public String parseOntologyName(String jsonFilename) throws IOException {
        return underTest.parse(IOUtils
                .readIntoString(OntologyNameJsonParserTest.class
                        .getResourceAsStream(jsonFilename)));
    }

    @Before
    public void setUp() {
        this.underTest = new OntologyNameJsonParser(new JavaJsonParser());
    }
}
