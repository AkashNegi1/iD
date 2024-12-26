import { select as d3_select } from 'd3-selection';
import { t } from '../core/localizer';
import { svgIcon } from '../svg/icon';
import { uiSection } from '../ui/section';
import { utilEntityOrMemberSelector } from '../util';

export function uiCommitWarnings(context) {
    let _issuesBySeverity = [];

    function commitWarnings(selection) {
        // Load issues by severity
        _issuesBySeverity = context.validator()
            .getIssuesBySeverity({ what: 'edited', where: 'all', includeDisabledRules: true });

        for (let severity in _issuesBySeverity) {

            let issues = _issuesBySeverity[severity];

            if (severity !== 'error') {
                // Exclude 'help_request' type issues
                issues = issues.filter(issue => issue.type !== 'help_request');
            }

            if (!issues.length) continue;

            const section = uiSection('issues-'+severity , context)
                .label(() => {
                    const count = issues.length;
                    return t.append(
                        'inspector.title_count',
                        { title: t('issues.' + severity + 's.list_title'), count: count }
                    );
                })
                .disclosureContent(selection => renderIssuesList(selection, issues));

                // Wrap the selection in a div with the class modal-section
                selection = selection
                .selectAll('.'+severity + '-section')
                .data([0]);

                selection = selection.enter()
                .append('div')
                .attr('class', 'modal-section')
                .merge(selection);

            // Add the appropriate class for styling based on severity
            selection
                .call(section.render)
                .classed(severity + '-section', true);

        }
    }


    function renderIssuesList(selection, issues) {

        let container = selection
            .selectAll('.changeset-list')
            .data([0]);


        container = container.enter()
            .append('ul')
            .attr('class', 'changeset-list')
            .merge(container);

        const items = container.selectAll('li')
            .data(issues, d => d.key);

        items.exit().remove();

        const itemsEnter = items.enter()
            .append('li')
            .attr('class', d => 'issue severity-' + d.severity);

        const buttons = itemsEnter
            .append('button')
            .on('mouseover', (d3_event, d) => {
                if (d.entityIds) {
                    context.surface().selectAll(
                        utilEntityOrMemberSelector(d.entityIds, context.graph())
                    ).classed('hover', true);
                }
            })
            .on('mouseout', () => {
                context.surface().selectAll('.hover').classed('hover', false);
            })
            .on('click', (d3_event, d) => {
                context.validator().focusIssue(d);
            });

        const textEnter = buttons
            .append('span')
            .attr('class', 'issue-text');

        textEnter
            .append('span')
            .attr('class', 'issue-icon')
            .each((d, i, nodes) => {
                const iconName = '#iD-icon-' + (d.severity === 'warning' ? 'alert' : 'error');
                d3_select(nodes[i]).call(svgIcon(iconName));
            });

        textEnter
            .append('span')
            .attr('class', 'issue-message');

        itemsEnter
            .merge(items)
            .selectAll('.issue-message')
            .text('')
            .each((d, i, nodes) => d.message(context)(d3_select(nodes[i])));


    }

    return commitWarnings;
}
