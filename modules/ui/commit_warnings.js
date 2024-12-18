import { select as d3_select } from 'd3-selection';
import { t } from '../core/localizer';
import { svgIcon } from '../svg/icon';
import { uiSection } from '../ui/section';
import { utilEntityOrMemberSelector } from '../util';

export function uiCommitWarnings(context) {
    var _issuesBySeverity = {};

    function commitWarnings(selection) {
        // Wrap the selection in a div with the class modal-section
        selection = selection.append('div').attr('class', 'modal-section');

        // Load issues by severity
        _issuesBySeverity = context.validator()
            .getIssuesBySeverity({ what: 'edited', where: 'all', includeDisabledRules: true });

        for (let severity in _issuesBySeverity) {
            let issues = _issuesBySeverity[severity];

            if (severity !== 'error') { // exclude 'fixme' and similar - #8603
                issues = issues.filter(function(issue) { return issue.type !== 'help_request'; });
            }

            if (!issues.length) continue;

            // Create a collapsible section for each severity level
            var section = uiSection('issues-' + severity, context)
                .label(() => {
                    var count = issues.length;
                    return t.append(
                        'inspector.title_count',
                        { title: t('issues.' + severity + 's.list_title'), count: count }
                    );
                })
                .disclosureContent(function(selection) {
                    return renderIssuesList(selection, severity, issues);
                })
                .shouldDisplay(function() {
                    return issues && issues.length;
                });

            // Add the appropriate class for styling based on severity
            selection
                .call(section.render)
                .classed(severity + '-section', true);
        }
    }

    function renderIssuesList(selection, severity, issues) {
        selection.selectAll('.issues-list').remove();
        var container = selection
            .append('ul')
            .attr('class', 'changeset-list');

        container.exit().remove();

        var items = container.selectAll('li')
            .data(issues, function(d) { return d.key; });

        items.exit().remove();

        var itemsEnter = items.enter()
            .append('li')
            .attr('class', function (d) { return 'issue severity-' + d.severity; });

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
                context.surface().selectAll('.hover').classed('hover', false);
            })
            .on('click', function(d3_event, d) {
                context.validator().focusIssue(d);
            });

            var textEnter = buttons
            .append('span')
            .attr('class', 'issue-text');

        textEnter
            .append('span')
            .attr('class', 'issue-icon')
            .each(function(d) {
                var iconName = '#iD-icon-' + (d.severity === 'warning' ? 'alert' : 'error');
                d3_select(this)
                    .call(svgIcon(iconName));
            });

        textEnter
            .append('span')
            .attr('class', 'issue-message');

        itemsEnter
            .merge(items)
            .selectAll('.issue-message')
            .text('')
            .each(function(d) {
                return d.message(context)(d3_select(this));
            });
    }

    return commitWarnings;
}
