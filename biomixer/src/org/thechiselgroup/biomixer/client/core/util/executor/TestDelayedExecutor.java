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
package org.thechiselgroup.biomixer.client.core.util.executor;

/**
 * Replacement for {@link GwtDelayedExecutor} when testing. No delay is actually
 * used.
 * 
 * @author drusk
 * 
 */
public class TestDelayedExecutor implements DelayedExecutor {

    private int delay;

    @Override
    public void execute(Runnable command) {
        command.run();
    }

    @Override
    public void setDelay(int delay) {
        this.delay = delay;
    }

}
