/*
 * avrwallet.c
 *
 * Created: 2018-04-22 오후 4:40:56
 * Author : user
 */ 


//#include <avr/io.h>
#include <avr/interrupt.h>
//#include <avr/pgmspace.h>
#include <stdio.h>

//#include <avr/sleep.h>
//#include <util/delay.h>

#include "common.h"
#include "stream_comm.h"
#include "wallet.h"
#include "xex.h"
#include "hwinit.h"
#include "lcd_and_input.h"

// 내 모듈은 16MHz 크리스탈사용, 컴파일러에게 안알려주면 1MHz 인식
// _delay_ms()의 최대시간 16.38ms, _delay_us() 최대 시간 48us
#define F_CPU 16000000UL          //UL unsigned long

/*
i >> x  : i의 비트열을 오른쪽으로 x만큼 이동
i << x  : i의 비트열을 왼쪽으로 x만큼 이동
*/
//static bool accept_button_test;

void tx0Char(char message);
void tx1Char(char message);

static int Putchar(char c, FILE *stream){
	
	// UART 두 개에 다 메시지를 출력함
	tx0Char(c);
	tx1Char(c);
	return 0;
}

// UART0 을 이용한 출력
void tx0Char(char message){
	
	while (((UCSR0A>>UDRE0)&0x01) == 0) ;  // UDRE, data register empty
	UDR0 = message;
}

// UART1 을 이용한 출력
void tx1Char(char message){
	
	while (((UCSR1A>>UDRE1)&0x01) == 0) ;  // UDRE, data register empty
	UDR1 = message;
}


void port_init(void){
	
	PORTA = 0x00;
	DDRA  = 0x00;
	PORTB = 0x00;
	DDRB  = 0x00;
	PORTC = 0x00; //m103 output only
	DDRC  = 0x00;
	PORTD = 0x00;
	DDRD  = 0x00;
	PORTE = 0x00;
	DDRE  = 0x00;
	PORTF = 0x00;
	DDRF  = 0x00;
	PORTG = 0x00;
	DDRG  = 0x00;
}

/* //UART0 initialize
// desired baud rate: 9600
// actual: baud rate:9615 (0.2%)
// char size: 8 bit
// parity: Disabled
*/
void uart0_init(void){
	
	UCSR0B = 0x00; //disable while setting baud rate
	UCSR0A = 0x00;
	UCSR0C = 0x06;   // 0000_0110
	UBRR0L = 0x67; //set baud rate lo
	UBRR0H = 0x00; //set baud rate hi
	//UCSR0B = 0x18;  // 수신가능
	UCSR0B= (1<<RXEN0)|(1<<TXEN0)|(1<<RXCIE0);
}

/*
// UART1 initialize
// desired baud rate:9600
// actual baud rate:9615 (0.2%)
// char size: 8 bit
// parity: Disabled
*/
void uart1_init(void){
	
	UCSR1B = 0x00; //disable while setting baud rate
	UCSR1A = 0x00;
	UCSR1C = 0x06;
	// UBRR1L = 0x2F; //set baud rate lo 7.3728 MHz
	// UBRR1L = 0x47; //set baud rate lo 11.0592 Mhz
	UBRR1L = 0x67; //set baud rate lo 16Mhz
	UBRR1H = 0x00; //set baud rate hi
	UCSR1B = 0x18;
	//UCSR0B= (1<<RXEN0)|(1<<TXEN0)|(1<<RXCIE0);
}

// 시간 지연 함수
void delay_us(int time_us){
	
	register int i;
	for(i=0; i<time_us; i++){   // 4 cycle +
		asm("PUSH   R0");        // 2 cycle +
		asm("POP    R0");        // 2 cycle +
		asm("PUSH   R0");        // 2 cycle +
		asm("POP    R0");        // 2 cycle +
		/* asm("PUSH   R0");        // 2 cycle +
		asm("POP    R0");        // 2 cycle   = 16 cycle = 1us for 16MHz*/
	}
}

void delay_ms(int time_ms){
	
	register int i;
	for(i=0;i<time_ms;i++) delay_us(1000);
}

//call this routine to initialize all peripherals
void init_devices(void){
	
	//stop errant interrupts until set up
	cli(); //disable all interrupts
	XMCRA = 0x00; //external memory
	XMCRB = 0x00; //external memory
	port_init();
	uart0_init();
	uart1_init();
	fdevopen(Putchar,0);
	
	MCUCR = 0x00;
	EICRA = 0x00; //extended ext ints
	EICRB = 0x00; //extended ext ints
	EIMSK = 0x00;
	TIMSK = 0x00; //timer interrupt sources
	ETIMSK = 0x00; //SREG 직접 설정 대신 모듈화 호출
	sei(); //re-enable interrupts
	//all peripherals are now initialized
}

/** This will be called whenever something very unexpected occurs. This
  * function must not return. 
  */
void fatalError(void)
{
	streamError();
	cli();
	for (;;)
	{
		// do nothing
	}
}

/** PBKDF2 is used to derive encryption keys. In order to make brute-force
  * attacks more expensive, this should return a number which is as large
  * as possible, without being so large that key derivation requires an
  * excessive amount of time (> 1 s). This is a platform-dependent function
  * because key derivation speed is platform-dependent.
  *
  * In order to permit key recovery when the number of iterations is unknown,
  * this should be a power of 2. That way, an implementation can use
  * successively greater powers of 2 until the correct number of iterations is
  * found.
  * \return Number of iterations to use in PBKDF2 algorithm.
  */
uint32_t getPBKDF2Iterations(void)
{
	return 128;
}

//#define PUSH_BTN 0x01
#define _BV(bit)  (1 << (bit))



int main(void){
	
	 //accept_button_test = false;
	
	 init_devices();
	 initUsart();
	 initAdc();  // need to check this operation working
	 initLcdAndInput();
	 
	 cli(); //disable all interrupts
	 //{ Interrupt Key setting Part
	 // DDR 기본적으로 0 으로 세팅되어 있음
	 DDRD |= 0<<PD0;  // 입력으로 설정,  BUTTON용
	 DDRD |= 0<<PD2;  // 입력으로 설정,  BUTTON용(CANCEL)
 
	 //falling edge에서 인터럽트 발생
	 //EICRA  &= ~(1<<ISC00); 
	 EICRA |= ~_BV(ISC00);
	 EICRA |= _BV(ISC01);
	 EIMSK |= _BV(INT0);// | _BV(INT1);
	 EICRA |= ~_BV(ISC20);
	 EICRA |= _BV(ISC21);
	 EIMSK |= (1<<INT2);  //External Interrupt Request 0 Enable
						//PD0에 스위치 연결, 풀업 저항을 추가한 회로여야 한다.
	 
	
	 sei();      //Global Interrupt Enable
	 //}

	//__DATE__, __TIME__   Compile date time.
	printf("UART RX Interrupt Test Program.  [%s %s]\r",__DATE__,__TIME__);
	
	do
	{
		processPacket();
/*		delay_ms(1000);
		printf("PIND : %d,%02x, ",PIND,PIND);
		if(PIND & PUSH_BTN)
			printf(" unpressed ");
		else
			printf(" pressed ");*/
				
	} while (true);
}

/*
//Interrupt Service Routine for INT0
ISR(INT0_vect)
{
	char c;
	//printf(" INT0 ");
	for(int i=0;i<3;i++){			
		//c = getString(arg_s->next_set, arg_s->next_spec, i);
		tx1Char('A');
	}
	//printString("인터럽트발생\n\r");
	
	//PORTD &= ~(1<<PD0);
	//delay_ms(500);
	
}
*/