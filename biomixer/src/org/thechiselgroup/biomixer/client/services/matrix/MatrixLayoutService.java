/*******************************************************************************
 * Copyright 2012 David Rusk, Elena Voyloshnikova
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
package org.thechiselgroup.biomixer.client.services.matrix;

import java.io.IOException;

import com.google.gwt.user.client.rpc.RemoteService;
import com.google.gwt.user.client.rpc.RemoteServiceRelativePath;

/**
 * Retrieves the mappings data for the matrix layout stored on the server.
 * 
 * @author elenavoy
 */
/*
 * XXX not sure why I need to have the path like this. Followed recommendation
 * of:
 * http://stackoverflow.com/questions/6577909/unable-to-make-call-to-service-
 * on-gwt
 */
@RemoteServiceRelativePath("../org.thechiselgroup.biomixer.BioMixerWorkbench/matrixLayout")
public interface MatrixLayoutService extends RemoteService {

    String getMatrixLayoutAsJson() throws IOException;

}