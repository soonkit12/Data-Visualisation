from __future__ import absolute_import
from __future__ import unicode_literals

from django.core.files.storage import default_storage
from django.core.urlresolvers import reverse_lazy
from django.http import HttpResponseRedirect, StreamingHttpResponse
from django.shortcuts import render
from django.utils import timezone
from django.views.generic import FormView, TemplateView
from django_mongokit import get_database
from sendfile import sendfile
import os.path

from .mixin import AjaxTemplateMixin, PermissionRequiredMixin, PageTitleMixin, SuccessMessageMixin
from ..forms import DiagnosticsForm
from ..tasks import dump_diagnostics


class DiagnosticMixin(PageTitleMixin, SuccessMessageMixin, PermissionRequiredMixin):
    permission_required = ['system.view_log_files']
    page_title = 'Diagnostics'
    form_class = DiagnosticsForm


class DiagnosticView(DiagnosticMixin, FormView):
    template_name = 'system/diagnostic.html'


class CsvView(DiagnosticMixin, FormView):
    template_name = 'system/csv.html'

    def get_initial(self):
        initial = super(CsvView, self).get_initial()
        now = timezone.now()
        initial['start_time'] = now - timezone.timedelta(days=1)
        initial['end_time'] = now
        return initial

    def form_valid(self, form):
        start = form.cleaned_data['start_time']
        end = form.cleaned_data['end_time']
        self.job_id = dump_diagnostics.apply_async((start, end), expires=60).id
        return super(CsvView, self).form_valid(form)

    def get_success_url(self):
        return '%s?job=%s' % (reverse_lazy('system:diagnostic-download'), self.job_id)


class DiagnosticDownloadView(DiagnosticMixin, AjaxTemplateMixin, TemplateView):
    template_name = 'system/diagnostic-download.html'
    page_title = 'Downloading diagnostics...'

    def render_to_response(self, context, **response_kwargs):
        dump_format = self.request.GET.get('format')
        job_id = self.request.GET.get('job')

        if not job_id:
            return HttpResponseRedirect(reverse_lazy('system:diagnostic'))

        result = dump_diagnostics.AsyncResult(job_id)

        if result.state == 'SUCCESS':
            if not self.request.is_ajax() and dump_format == 'csv':
                file_path = os.path.join(default_storage.location, result.info['file_path'])
                # Encoding must be specified to prevent guessing, which then results in 'gzip' encoding
                # being sent to the browser, and causes the browser to decompress the content on-the-fly,
                # therefore corrupting the attachment.
                return sendfile(self.request, file_path, attachment=True,
                    mimetype='application/octet-stream', encoding='identity')

            download_link = '%s?job=%s&format=csv' % (reverse_lazy('system:diagnostic-download'), job_id)
            context['progress'] = 100
            context['progress_active'] = False
            context['status'] = ('Your download is ready. Click <a href="%s">here</a> ' +
                'if the download does not start automatically.') % download_link
            context['download_link'] = download_link

        elif result.state in ['FAILURE', 'REVOKED']:
            context['progress'] = 99
            context['progress_active'] = False
            if result.state == 'REVOKED':
                context['status'] = (('Too many download requests at a time. ' +
                    'Please wait one (1) minute and <a href="%s">try</a> again.') %
                    reverse_lazy('system:diagnostic'))
            else:
                context['status'] = (('Some error has occurred. Please <a href="%s">try</a> again.<br/>' +
                    '<small>%s</small>') %
                    (reverse_lazy('system:diagnostic'), result.info))

        else:
            if result.state == 'PROGRESS':
                context['progress'] = result.info['progress']
            else:
                context['progress'] = 0
            context['progress_active'] = True
            context['status'] = 'Please wait while the system prepares your download.'

        if context['progress_active']:
            response_kwargs['status'] = 202
        return super(DiagnosticDownloadView, self).render_to_response(context, **response_kwargs)


class BatteryCurrentView(DiagnosticMixin, TemplateView):
    template_name = 'system/batterycurrent.html'


class BoardTemperatureView(DiagnosticMixin, TemplateView):
    template_name = 'system/boardtemperature.html'


class LaserSensorView(DiagnosticMixin, TemplateView):
    template_name = 'system/lasersensor.html'


class DataView(DiagnosticMixin, TemplateView):

    def render_to_response(self, request):
        results = []
        end = timezone.now()
        start = end - timezone.timedelta(seconds=3600)

        cursor = get_database().Diagnostic.find({
            'timestamp': {
                '$gte': start,
                '$lt': end
            },
        }).sort('timestamp')

        first = True
        for doc in cursor:
            if first:
                keys = ['Timestamp']
                for st in doc['status']:
                    for kv in st['values']:
                        keys.append(kv['key'])
                if len(keys) >= 0:
                    continue
                results.append('"%s"\n' % '","'.join(keys))
                first = False

            values = [timezone.make_naive(doc['timestamp'])]
            for st in doc['status']:
                for kv in st['values']:
                    values.append(kv['value'])
            results.append('"%s"\n' % '","'.join(['%s' % v for v in values]))

        return StreamingHttpResponse(results, content_type='text/csv')
