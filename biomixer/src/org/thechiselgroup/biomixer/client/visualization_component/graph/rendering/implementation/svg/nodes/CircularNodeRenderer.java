package org.thechiselgroup.biomixer.client.visualization_component.graph.rendering.implementation.svg.nodes;

import org.thechiselgroup.biomixer.client.core.util.text.TextBoundsEstimator;
import org.thechiselgroup.biomixer.client.visualization_component.graph.rendering.NodeRenderer;
import org.thechiselgroup.biomixer.client.visualization_component.graph.rendering.RenderedNode;
import org.thechiselgroup.biomixer.client.visualization_component.graph.rendering.implementation.svg.expanders.BoxedTextSvgExpanderTabRenderer;
import org.thechiselgroup.biomixer.client.visualization_component.graph.widget.Node;
import org.thechiselgroup.biomixer.shared.svg.Svg;
import org.thechiselgroup.biomixer.shared.svg.SvgElement;
import org.thechiselgroup.biomixer.shared.svg.SvgElementFactory;

public class CircularNodeRenderer implements NodeRenderer {

    public static final double RX_DEFAULT = 10.0;

    public static final double RY_DEFAULT = 10.0;

    private SvgElementFactory svgElementFactory;

    private BoxedTextSvgExpanderTabRenderer expanderTabRenderer;

    private TextBoundsEstimator textBoundsEstimator;

    public CircularNodeRenderer(SvgElementFactory svgElementFactory,
            TextBoundsEstimator textBoundsEstimator) {
        this.textBoundsEstimator = textBoundsEstimator;
        assert svgElementFactory != null;
        assert textBoundsEstimator != null;
        this.svgElementFactory = svgElementFactory;
        this.expanderTabRenderer = new BoxedTextSvgExpanderTabRenderer(
                svgElementFactory);
    }

    @Override
    public RenderedNode createRenderedNode(Node node) {
        assert node != null;

        SvgElement baseContainer = svgElementFactory.createElement(Svg.SVG);
        baseContainer.setAttribute(Svg.OVERFLOW, Svg.VISIBLE);
        baseContainer.setAttribute(Svg.ID, node.getId());
        baseContainer.setAttribute(Svg.X, 0.0);
        baseContainer.setAttribute(Svg.Y, 0.0);

        SvgCircleWithText boxedText = new SvgCircleWithText(node.getLabel(),
                textBoundsEstimator, svgElementFactory);
        boxedText.setCornerCurveWidth(RX_DEFAULT);
        boxedText.setCornerCurveHeight(RY_DEFAULT);

        SvgRectangularExpansionTab expanderTab = expanderTabRenderer
                .createExpanderTabSvgElement();
        expanderTab
                .setLocation(
                        (boxedText.getTotalWidth() - BoxedTextSvgExpanderTabRenderer.TAB_WIDTH) / 2,
                        boxedText.getTotalHeight());

        return new CircularRenderedNode(node, baseContainer, boxedText,
                expanderTab);
    }
}
