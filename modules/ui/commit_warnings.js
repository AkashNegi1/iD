import { select as d3_select } from 'd3-selection';

import { t } from '../core/localizer';
import { svgIcon } from '../svg/icon';
import { uiTooltip } from './tooltip';
import { utilEntityOrMemberSelector } from '../util';


export function uiCommitWarnings(context) {

    function commitWarnings(selection) {
        var issuesBySeverity = context.validator()
            .getIssuesBySeverity({ what: 'edited', where: 'all', includeDisabledRules: true });

        for (var severity in issuesBySeverity) {
            var issues = issuesBySeverity[severity];

            if (severity !== 'error') {      // exclude 'fixme' and similar - #8603
                issues = issues.filter(function(issue) { return issue.type !== 'help_request'; });
            }

            var displayIssues = issues.slice(0, 5); // Display only the first warning
            var hiddenIssues = issues.slice(5); // Remaining warnings
            var hasMoreIssues = issues.length > 5; // Check if there are more than 5 issues


            var section = severity + '-section';
            var issueItem = severity + '-item';

            var container = selection.selectAll('.' + section)
                .data(displayIssues.length ? [0] : []);

            container.exit()
                .remove();

            var containerEnter = container.enter()
                .append('div')
                .attr('class', 'modal-section ' + section + ' fillL2');

            containerEnter
                .append('h3')
                .call(severity === 'warning' ? t.append('commit.warnings') : t.append('commit.errors'));

            containerEnter
                .append('ul')
                .attr('class', 'changeset-list');

            container = containerEnter
                .merge(container);


            var items = container.select('ul').selectAll('li')
                .data(displayIssues, function(d) { return d.key; });

            items.exit()
                .remove();

            var itemsEnter = items.enter()
                .append('li')
                .attr('class', issueItem);

            var buttons = itemsEnter
                .append('button')
                .on('mouseover', function(d3_event, d) {
                    if (d.entityIds) {
                        context.surface().selectAll(
                            utilEntityOrMemberSelector(
                                d.entityIds,
                                context.graph()
                            )
                        ).classed('hover', true);
                    }
                })
                .on('mouseout', function() {
                    context.surface().selectAll('.hover')
                        .classed('hover', false);
                })
                .on('click', function(d3_event, d) {
                    context.validator().focusIssue(d);
                });

            buttons
                .call(svgIcon('#iD-icon-alert', 'pre-text'));

            buttons
                .append('strong')
                .attr('class', 'issue-message');

            buttons.filter(function(d) { return d.tooltip; })
                .call(uiTooltip()
                    .title(function(d) { return d.tooltip; })
                    .placement('top')
                );

            items = itemsEnter
                .merge(items);

            items.selectAll('.issue-message')
                .text('')
                .each(function(d){
                    return d.message(context)(d3_select(this));
                 });

            // Adding ellipsis if there are more issues
            if (hasMoreIssues) {
                // IIFE to create a new scope for each instance
                (function(localContainer) {

                    var ellipsisItem = localContainer.select('ul').selectAll('.ellipsis')
                        .data([0]);

                    ellipsisItem.enter()
                        .append('div')
                        .attr('class', 'ellipsis')
                        .append('button')
                        .text('...More warnings')
                        .on('click', function() {
                            var hiddenItems = localContainer.select('ul').selectAll('.hidden-warning');
                            if (!hiddenItems.empty()) {
                                var isHidden = hiddenItems.style('display') === 'none';
                                hiddenItems.style('display', isHidden ? 'block' : 'none');
                                d3_select(this).text(isHidden ? 'Show less' : '...More warnings'); // Change button text
                            }
                        });

                    ellipsisItem.exit().remove();

                    var hiddenItems = localContainer.select('ul').selectAll('.hidden-warning')
                        .data(hiddenIssues, function(d) { return d.key; });

                    var hiddenItemsEnter = hiddenItems.enter()
                        .append('li')
                        .attr('class', 'hidden-warning ' + issueItem)
                        .style('display', 'none'); // Hide the additional warnings initially

                    hiddenItemsEnter.append('button')
                        .on('mouseover', function(d3_event, d) {
                            if (d.entityIds) {
                                context.surface().selectAll(
                                    utilEntityOrMemberSelector(
                                        d.entityIds,
                                        context.graph()
                                    )
                                ).classed('hover', true);
                            }
                        })
                        .on('mouseout', function() {
                            context.surface().selectAll('.hover').classed('hover', false);
                        })
                        .on('click', function(d3_event, d) {
                            context.validator().focusIssue(d);
                        })
                        .call(svgIcon('#iD-icon-alert', 'pre-text'))
                        .append('strong')
                        .attr('class', 'issue-message')
                        .text('')
                        .each(function(d) {
                            return d.message(context)(d3_select(this));
                        });

                    hiddenItems.exit().remove();
                })(container); // Pass the container to the IIFE
            }
        }
    }

    return commitWarnings;
}
