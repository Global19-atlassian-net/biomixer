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
package org.thechiselgroup.biomixer.client.workbench.command.ui;

import static org.mockito.Matchers.any;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.thechiselgroup.biomixer.client.core.command.CommandManager;
import org.thechiselgroup.biomixer.client.core.command.DefaultCommandManager;
import org.thechiselgroup.biomixer.client.core.command.NullCommand;
import org.thechiselgroup.biomixer.client.core.command.TestUndoableCommandWithDescription;
import org.thechiselgroup.biomixer.client.core.test.mockito.MockitoGWTBridge;
import org.thechiselgroup.biomixer.client.core.ui.Action;
import org.thechiselgroup.biomixer.client.core.visualization.model.VisualItem;
import org.thechiselgroup.biomixer.client.core.visualization.model.VisualItemValueResolver;
import org.thechiselgroup.biomixer.client.core.visualization.model.VisualItemValueResolverContext;
import org.thechiselgroup.biomixer.client.workbench.client.command.ui.RedoActionStateController;

public class RedoActionStateControllerTest {

    private static final String COMMAND_DESCRIPTION = "command";

    @Mock
    private TestUndoableCommandWithDescription command;

    private CommandManager commandManager;

    private RedoActionStateController underTest;

    private Action action;

    @Mock
    private VisualItemValueResolver resolver;

    // TODO tests for command manager with initial state
    @Test
    public void buttonsDisabledInitialyForEmptyCommandManager() {
        verify(action, times(1)).setEnabled(false);
    }

    @Test
    public void disableButtonsOnClear() {
        commandManager.execute(command);
        commandManager.execute(command);
        commandManager.undo();

        verify(action, times(3)).setEnabled(false);

        commandManager.clear();

        verify(action, times(4)).setEnabled(false);
    }

    @Test
    public void disableRedoButtonOnEventIfNotRedoable() {
        commandManager.execute(command);
        commandManager.undo();
        commandManager.redo();

        verify(action, times(3)).setEnabled(false);
    }

    @Test
    public void disableRedoCommandDescriptionOnEventIfNotRedoable() {
        commandManager.execute(command);
        commandManager.undo();
        commandManager.redo();

        verify(action, times(3)).setDescription("");
    }

    @Test
    public void enableRedoButtonOnEventIfRedoable() {
        commandManager.execute(command);
        commandManager.undo();

        verify(action, times(1)).setEnabled(true);
    }

    @Test
    public void setRedoButtonDescriptionOnEventIfRedoable() {
        commandManager.execute(command);
        commandManager.undo();

        verify(action, times(1)).setDescription(COMMAND_DESCRIPTION);
    }

    @Before
    public void setUp() throws Exception {
        MockitoGWTBridge.setUp();
        MockitoAnnotations.initMocks(this);

        action = spy(new Action("", new NullCommand()));
        commandManager = spy(new DefaultCommandManager());
        underTest = new RedoActionStateController(commandManager, action);

        when(
                resolver.resolve(any(VisualItem.class),
                        any(VisualItemValueResolverContext.class))).thenReturn(
                "");
        when(command.getDescription()).thenReturn(COMMAND_DESCRIPTION);

        underTest.init();
    }

    @After
    public void tearDown() {
        MockitoGWTBridge.tearDown();
    }

}
