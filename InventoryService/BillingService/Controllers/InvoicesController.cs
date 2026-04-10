using BillingService.Application.DTOs;
using BillingService.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BillingService.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InvoicesController : ControllerBase
    {
        private readonly IInvoiceService _service;
        private readonly ILogger<InvoicesController> _logger;

        public InvoicesController(IInvoiceService service, ILogger<InvoicesController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpPost]
        [ProducesResponseType(typeof(InvoiceDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Create([FromBody] CreateInvoiceDto dto, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _service.CreateAsync(dto, cancellationToken);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning("Validation error creating invoice: {Message}", ex.Message);
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error creating invoice");
                return StatusCode(500, new { error = "An unexpected error occurred. Please try again later." });
            }
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<InvoiceDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
        {
            var invoices = await _service.GetAllAsync(cancellationToken);
            return Ok(invoices);
        }

        [HttpGet("{id:guid}")]
        [ProducesResponseType(typeof(InvoiceDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
        {
            var invoice = await _service.GetByIdAsync(id, cancellationToken);
            return invoice != null ? Ok(invoice) : NotFound();
        }

        [HttpPost("{id:guid}/print")]
        [ProducesResponseType(typeof(InvoiceDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Print(Guid id, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _service.PrintAsync(id, cancellationToken);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning("Validation error printing invoice {InvoiceId}: {Message}", id, ex.Message);
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error printing invoice {InvoiceId}", id);
                return StatusCode(500, new { error = "An unexpected error occurred. Please try again later." });
            }
        }

        [HttpPatch("{id:guid}/status")]
        [ProducesResponseType(typeof(InvoiceDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateInvoiceStatusDto dto, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _service.UpdateStatusAsync(id, dto.Status, cancellationToken);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning("Validation error updating status of invoice {InvoiceId}: {Message}", id, ex.Message);
                return ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase)
                    ? NotFound(new { error = ex.Message })
                    : BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error updating status of invoice {InvoiceId}", id);
                return StatusCode(500, new { error = "An unexpected error occurred. Please try again later." });
            }
        }
    }
}
